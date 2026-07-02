import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  useIsFocused,
} from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  FlatList,
  BackHandler,
  Alert,
  TextInput,
} from 'react-native';
import { supabase } from './Supabase';
import { VideoView, useVideoPlayer } from 'expo-video';
function VideoPreview({
  uri,
  onPress,
  isVisible,
  screenFocused,
  expanded,
}) {
  const [finished, setFinished] =
    useState(false);
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
    player.play();
  });
  useEffect(() => {
    if (!player) return;

    if (isVisible && screenFocused) {

      player.muted = false;

      if (!finished) {
        player.play();
      }

    } else {

      player.pause();
      player.muted = true;

      setFinished(false);
    }
  }, [isVisible, screenFocused]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!player) return;

      if (
        player.duration > 0 &&
        player.currentTime >=
        player.duration - 0.5
      ) {
        player.pause();
        player.currentTime = 0;
        setFinished(true);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [player]);


  return (
    <View>
      <VideoView
        player={player}
        style={{
          width: '100%',
          height: 300,
          borderRadius: 10,
        }}
        nativeControls={false}
        contentFit="cover"
      />

      <Pressable
        onPress={() => {
          onPress();
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          elevation: 999,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: 'white',
            fontSize: 50,
            fontWeight: 'bold',
          }}
        >
          ▶
        </Text>
      </View>
    </View>
  );
}


export default function HomeScreen({ route, navigation }) {
  const [posts, setPosts] = useState([]);
  const [postLimit, setPostLimit] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [likesMap, setLikesMap] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [notificationMap, setNotificationMap] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const isFocused = useIsFocused();
  const [visibleVideos, setVisibleVideos] = useState([]);
  const [expandedVideoId, setExpandedVideoId] = useState(null);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      setVisibleVideos(
        viewableItems.map(
          (item) => item.item.id
        )
      );
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
  };
  useEffect(() => {
    if (isFocused) {
      getPosts(selectedCategory);
      getNotifications();
    }
  }, [isFocused]);

  const isHomeMode = selectedCategory === null;
  useEffect(() => {
    getPosts(selectedCategory);
  }, []);
  useEffect(() => {
    if (route?.params?.resetHome) {
      setSelectedCategory(null);
      getPosts();
    }
  }, [route?.params?.resetHome]);

  useEffect(() => {
    if (!isFocused) return;

    const backAction = () => {
      Alert.alert(
        'Keluar Aplikasi',
        'Apakah mau keluar aplikasi?',
        [
          {
            text: 'TIDAK',
            style: 'cancel',
          },
          {
            text: 'YA',
            onPress: () => BackHandler.exitApp(),
          },
        ]
      );

      return true;
    };

    const backHandler =
      BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

    return () => backHandler.remove();
  }, [isFocused]);

  async function getPosts(
    category = null,
    limitValue = postLimit
  ) {
    // GANTI QUERY INI 👇
    let query = supabase
    .from('posts')
    .select(`
        *,
        profiles!user_id!left (
            name,
            avatar_url
        )
    `)
    .eq('status', 'approved');


    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query
      .order('id', {
        ascending: false,
      })
      .range(0, limitValue - 1);

    if (error) {
      console.log(error);
      return;
    }
    const postIds = data.map(item => item.id);
    setPosts(data);

    // AMBIL SEMUA LIKE
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id')
      .in('post_id', postIds);

    const likesCount = {};

    likesData?.forEach((item) => {
      likesCount[item.post_id] =
        (likesCount[item.post_id] || 0) + 1;
    });

    setLikesMap(likesCount);

    // AMBIL SEMUA KOMENTAR
    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    const commentsCount = {};

    commentsData?.forEach((item) => {
      commentsCount[item.post_id] =
        (commentsCount[item.post_id] || 0) + 1;
    });
    setCommentsMap(commentsCount);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: myLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id);

      const likedMap = {};

      myLikes?.forEach((item) => {
        likedMap[item.post_id] = true;
      });

      setLikedPosts(likedMap);
    }
  }


  async function handleLike(postId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (likedPosts[postId]) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: false,
      }));

      setLikesMap((prev) => ({
        ...prev,
        [postId]: Math.max(
          (prev[postId] || 1) - 1,
          0
        ),
      }));
    } else {
      await supabase
        .from('likes')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
          },
        ]);

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: true,
      }));

      setLikesMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      }));
    }
  }
  async function getNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: views } = await supabase
      .from('category_views')
      .select('*')
      .eq('user_id', user.id);

    const notificationData = {};

    const categories = [
      'profil_desa',
      'pengumuman',
      'pembangunan',
      'dok_desa',
      'seni_budaya',
      'dok_masyarakat',
    ];

    for (const category of categories) {
      const view = views?.find(
        (v) => v.category === category
      );

      let query = supabase
        .from('posts')
        .select('*')
        .eq('category', category)
        .eq('is_admin_post', true)
        .eq('status', 'approved');

      if (view?.last_seen) {
        query = query.gt(
          'created_at',
          view.last_seen
        );
      }

      const { data } = await query;

      notificationData[category] =
        data?.length || 0;
    }

    setNotificationMap(notificationData);
  }


  let pageTitle = 'Untuk Masyarakat Desa Kerticala';

  if (selectedCategory === 'profil_desa') {
    pageTitle = 'Profil Desa Kerticala';
  }

  if (selectedCategory === 'pengumuman') {
    pageTitle = 'Pengumuman Untuk Masyarakat';
  }

  if (selectedCategory === 'pembangunan') {
    pageTitle = 'Pembangunan Desa Kerticala';
  }

  if (selectedCategory === 'dok_desa') {
    pageTitle = 'Dokumentasi Kegiatan Desa';
  }

  if (selectedCategory === 'seni_budaya') {
    pageTitle = 'Seni & Budaya Desa Kerticala';
  }

  if (selectedCategory === 'dok_masyarakat') {
    pageTitle = 'Dokumentasi Kegiatan Masyarakat';
  }
  return (
    <View style={styles.container}>

      <View
        style={{
          marginTop: 15,
          marginBottom: 15,
        }}
      ></View>
      <View
        style={{
          marginTop: 5,
          marginBottom: 5,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: 0,
            marginTop: 0,
          }}
        >
          {[
            {
              label: '🏡 Profil Desa',
              category: 'profil_desa',
            },
            {
              label: '📢 Info Desa',
              category: 'pengumuman',
            },
            {
              label: '🏗 Pembangunan',
              category: 'pembangunan',
            },
            {
              label: '🏛 Kepemerintahan',
              category: 'dok_desa',
            },
            {
              label: '🎪 Seni & Budaya',
              category: 'seni_budaya',
            },
            {
              label: '👥 Kemasyarakatan',
              category: 'dok_masyarakat',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.category}
              onPress={() =>
                navigation.navigate('Category', {
                  title: item.label,
                  category: item.category,
                })
              }
              style={{
                width: '31%',
                backgroundColor:
                  selectedCategory === item.category
                    ? '#00ff88'
                    : '#ffffff',

                borderWidth: 1,

                borderColor:
                  selectedCategory === item.category
                    ? '#00ff88'
                    : '#00aa55',

                borderRadius: 12,
                paddingVertical: 5,
                marginBottom: 10,

                opacity:
                  selectedCategory === null
                    ? 1
                    : selectedCategory === item.category
                      ? 1
                      : 0.5,
              }}
            >
              <View>
                <Text
                  style={{
                    color:
                      selectedCategory === item.category
                        ? '#000'
                        : '#00aa55',

                    textAlign: 'center',
                    fontSize: 9,
                    fontWeight: 'bold',
                  }}
                >
                  {item.label}
                </Text>

                {notificationMap[item.category] > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: 'red',
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      {notificationMap[item.category]}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          placeholder="🔍 Cari informasi desa..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          style={{
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
            color: '#222',
          }}
        />
        <Text
          style={{
            color: '#00aa55',
            fontSize: 20,
            fontWeight: 'bold',
            marginTop: 1,
            marginLeft: 5,
          }}
        >
          {pageTitle}
        </Text>
      </View>

      <FlatList
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListFooterComponent={
          posts.length >= postLimit ? (
            <TouchableOpacity
              style={{
                backgroundColor: '#00aa55',
                margin: 15,
                padding: 12,
                borderRadius: 10,
              }}
              onPress={() => {
                const newLimit = postLimit + 50;

                setPostLimit(newLimit);

                getPosts(
                  selectedCategory,
                  newLimit
                );
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                Lihat Selanjutnya
              </Text>
            </TouchableOpacity>
          ) : null
        }

        data={posts.filter(
          item =>
            !searchText ||
            item.title
              ?.toLowerCase()
              .includes(searchText.toLowerCase())
        )}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (

          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              navigation.navigate(
                'MediaViewer',
                {
                  post: item,
                  likesCount: likesMap[item.id] || 0,
                  commentsCount: commentsMap[item.id] || 0,
                }
              )
            }}
          >

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              {item.profiles?.avatar_url || item.avatar_url ? (
                <Image
                  source={{
                    uri: item.profiles?.avatar_url || item.avatar_url,
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    marginRight: 10,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    marginRight: 10,
                    backgroundColor: '#ccc',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>👤</Text>
                </View>
              )}

              <Text
                style={{
                  color: '#222',
                  fontWeight: 'bold',
                  fontSize: 15,
                }}
              >
                {item.profiles?.name || item.username || item.author_name || 'User'}
              </Text>
            </View>


            {item.media_type === 'video' ? (
              <VideoPreview
                uri={item.image_url}
                isVisible={visibleVideos.includes(item.id)}
                screenFocused={isFocused}
                onPress={() =>
                  navigation.navigate(
                    'MediaViewer',
                    {
                      post: item,
                      likesCount: likesMap[item.id] || 0,
                      commentsCount: commentsMap[item.id] || 0,
                    }
                  )
                }
              />
            ) : (

              <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                resizeMode="cover"
                onError={(e) =>
                  console.log(
                    'ERROR GAMBAR =',
                    item.image_url,
                    e.nativeEvent
                  )
                }
              />
            )}

            <Text style={styles.titlePost}>
              {item.title || 'Tanpa Judul'}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
              }}
            >

              <Text
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                }}
              >
                ❤️ {likesMap[item.id] || 0}
              </Text>
              <Pressable
                onPress={() =>
                  navigation.navigate('Comments', {
                    post: item,
                  })
                }
                style={{ marginLeft: 20 }}
              >
                <Text style={{ color: '#222' }}>
                  💬 {commentsMap[item.id] || 0}
                </Text>
              </Pressable>

              <Text
                style={{
                  marginLeft: 20,
                  color: '#666',
                }}
              >
                📅 {new Date(item.created_at).toLocaleDateString('id-ID')}
              </Text>

            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                marginTop: 12,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: '#eee',
              }}
            >
              <TouchableOpacity
                onPress={() => handleLike(item.id)}

              >
                <Text
                  style={{
                    color: likedPosts[item.id]
                      ? 'red'
                      : '#888',
                    fontWeight: 'bold',
                  }}
                >
                  {likedPosts[item.id]
                    ? '❤️ Suka'
                    : '🤍 Suka'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Comments', {
                    post: item,
                  })
                }
              >
                <Text
                  style={{
                    color: '#222',
                    fontWeight: 'bold',
                  }}
                >
                  💬 Komentar
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f5',
    padding: 15,
  },

  title: {
    color: '#222',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    elevation: 2,
  },

  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  titlePost: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 5,
  },
  infoRow: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 5,
  },
  caption: {
    color: 'white',
    marginTop: 10,
  },
});