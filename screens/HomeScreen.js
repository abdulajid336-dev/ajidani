import React, { useState, useCallback, useEffect } from 'react';
import {
  useIsFocused,
} from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  BackHandler,
  Alert,
  TextInput,
} from 'react-native';

import { supabase } from './Supabase';
import { VideoView, useVideoPlayer } from 'expo-video';
function VideoItem({ uri }) {
  const player = useVideoPlayer(uri);

  return (
    <VideoView
      player={player}
      style={{
        width: '100%',
        height: 220,
      }}
      nativeControls
      contentFit="contain"
    />
  );
}
export default function HomeScreen({ route, navigation }) {
  const [posts, setPosts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [likesMap, setLikesMap] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [notificationMap, setNotificationMap] = useState({});
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      getPosts(selectedCategory);
      getNotifications();
    }
  }, [isFocused]);

  const isHomeMode = selectedCategory === null;
  useEffect(() => {
    getPosts();
    getNotifications();
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

  async function getPosts(category = null) {
    let query = supabase
      .from('posts')
      .select('*')
      .eq('status', 'approved');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('id', {
      ascending: false,
    });

    if (error) {
      console.log(error);
      return;
    }

    setPosts(data);

    // AMBIL SEMUA LIKE
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id');

    const likesCount = {};

    likesData?.forEach((item) => {
      likesCount[item.post_id] =
        (likesCount[item.post_id] || 0) + 1;
    });

    setLikesMap(likesCount);

    // AMBIL SEMUA KOMENTAR
    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id');

    const commentsCount = {};

    commentsData?.forEach((item) => {
      commentsCount[item.post_id] =
        (commentsCount[item.post_id] || 0) + 1;
    });
    setCommentsMap(commentsCount);
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
            onPress={() =>
              navigation.navigate('DetailPost', {
                post: item,
                selectedCategory,
                fromProfile: false,
              })
            }
          >

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              {item.author_avatar ? (
                <Image
                  source={{
                    uri: item.author_avatar,
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
                  }}
                />
              )}

              <Text
                style={{
                  color: '#222',
                  fontWeight: 'bold',
                  fontSize: 15,
                }}
              >
                {item.author_name}
              </Text>
            </View>

            {item.media_type === 'video' ? (
              <View>
                <Image
                  source={{
                    uri:
                      item.thumbnail_url ||
                      item.image_url,
                  }}
                  style={styles.image}
                />

                <View
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
            ) : (
              <Image
                source={{ uri: item.image_url }}
                style={styles.image}
              />
            )}

            <Text style={styles.titlePost}>
              {item.title || 'Tanpa Judul'}
            </Text>
            <Text style={styles.infoRow}>
              ❤️ {likesMap[item.id] || 0}
              {'   '}
              💬 {commentsMap[item.id] || 0}
              {'   '}
              📅 {new Date(item.created_at).toLocaleDateString('id-ID')}
            </Text>
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