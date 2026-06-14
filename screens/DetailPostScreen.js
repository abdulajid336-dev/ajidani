import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
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
        height: 350,
      }}
      nativeControls
      contentFit="cover"
    />
  );
}

export default function DetailPostScreen({ route, navigation }) {
  const {
    post,
    selectedCategory,
    fromProfile = false,
    fromAdmin = false,
  } = route.params;

  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    getLikes();
    getComments();
    checkLikeStatus();
    checkOwner();

    async function checkOwner() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (user.id === post.user_id) {
        setIsOwner(true);
      }
    }
  }, []);

  async function getLikes() {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);

    setLikesCount(count || 0);
  }
  async function checkLikeStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single();

    setLiked(!!data);
  }

  async function getComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: false });

    setComments(data || []);
    setCommentsCount(data?.length || 0);
  }

  async function addComment() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !commentText.trim()) return;

    await supabase.from('comments').insert([
      {
        post_id: post.id,
        user_id: user.id,
        comment: commentText,
        user_name: user.email,
      },
    ]);

    setCommentText('');
    getComments();
  }

  async function toggleLike() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      setLiked(false);
    } else {
      await supabase
        .from('likes')
        .insert([
          {
            post_id: post.id,
            user_id: user.id,
          },
        ]);

      setLiked(true);
    }

    getLikes();
  }
  async function deletePost() {
    Alert.alert(
      'Hapus Postingan',
      'Apakah Anda yakin ingin menghapus postingan ini?',
      [
        {
          text: 'Tidak',
          style: 'cancel',
        },
        {
          text: 'Ya',
          onPress: async () => {
            const imageUrl = post.image_url;

            const fileName = imageUrl.split('/').pop();

            const { data: removeData, error: storageError } =

              await supabase.storage
                .from('posts')
                .remove([fileName]);


            const { error } = await supabase
              .from('posts')
              .delete()
              .eq('id', post.id);

            const { data: checkData } = await supabase
              .from('posts')
              .select('*')
              .eq('id', post.id);

            if (error) {
              alert(error.message);
              return;
            }

            alert('Postingan berhasil dihapus');

            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
      }}
    >
      {post.media_type === 'video' ? (
        <VideoItem uri={post.image_url} />
      ) : (
        <Image
          source={{ uri: post.image_url }}
          style={{
            width: '100%',
            height: 500,
          }}
        />
      )}

      <View
        style={{
          padding: 20,
          marginTop: -18,
          backgroundColor: '#fff',
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          
        }}
      >
        <Text
          style={{
            color: '#222',
            fontSize: 26,
            fontWeight: 'bold',
            marginBottom: 5,
          }}
        >
          {post.title || 'Tanpa Judul'}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Text
            style={{
              color: 'lime',
              fontSize: 14,
              flex: 1,
            }}
          >
            📁 {post.category || 'Umum'}
          </Text>

          <TouchableOpacity onPress={toggleLike}>
            <Text
              style={{
                color: liked ? '#777' : 'red',
                fontSize: 22,
                marginRight: 35,
              }}
            >
              ♥ {likesCount}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              color: '#666',
              fontSize: 13,
              flex: 1,
            }}
          >
            📅 {new Date(post.created_at).toLocaleDateString('id-ID')}
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Comments', {
                post,
              })
            }
          >
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                marginRight: 25,
              }}
            >
              💬 {commentsCount}
            </Text>
          </TouchableOpacity>

        </View>
        {((isOwner && fromProfile) || fromAdmin) && (
          <TouchableOpacity
            onPress={deletePost}
            style={{
              backgroundColor: '#b71c1c',
              padding: 12,
              borderRadius: 10,
              marginTop: 20,
            }}
          >
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              🗑 Hapus Postingan
            </Text>
          </TouchableOpacity>
        )}
        <ScrollView
          style={{
            maxHeight: 250,
          }}
        >
          <Text
            style={{
              color: '#666',
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            {post.caption || 'Tidak ada keterangan'}
          </Text>
        </ScrollView>

      </View>
    </View >
  );
}