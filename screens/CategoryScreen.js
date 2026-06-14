import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { supabase } from './Supabase';
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
export default function CategoryScreen({
  route,
  navigation,
}) {
  const {
    title,
    category,
  } = route.params;

  const [posts, setPosts] = useState([]);
  useEffect(() => {
    getPosts();
    updateCategoryView();
  }, []);

  async function getPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'approved')
      .eq('category', category)
      .order('id', { ascending: false });

    setPosts(data || []);
  }
  async function updateCategoryView() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: existing } = await supabase
      .from('category_views')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .single();

    if (existing) {
      await supabase
        .from('category_views')
        .update({
          last_seen: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('category_views')
        .insert([
          {
            user_id: user.id,
            category: category,
            last_seen: new Date().toISOString(),
          },
        ]);
    }
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#121212',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          marginTop: 20,
          marginHorizontal: 15,
          marginBottom: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: '#0f3460',
            paddingVertical: 6,
            paddingHorizontal: 20,
            borderRadius: 10,
            alignSelf: 'center',
            marginTop: 15,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 14,
            }}
          >
            KEMBALI
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 15,
          }}
        >
          {title}
        </Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              marginBottom: 15,
              backgroundColor: '#1e1e1e',
            }}
            onPress={() =>
              navigation.navigate('DetailPost', {
                post: item,
                fromAdmin: false,
              })
            }
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingTop: 10,
                paddingBottom: 10,
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
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 'bold',
                }}
              >
                {item.author_name}
              </Text>
            </View>
            <Text style={{ color: 'yellow' }}>
              {item.media_type}
            </Text>
            {item.media_type === 'video' ? (
              <View>
                <Image
                  source={{
                    uri:
                      item.thumbnail_url ||
                      item.image_url,
                  }}
                  style={{
                    width: '100%',
                    height: 220,
                  }}
                />

                <View
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: 220,
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
                style={{
                  width: '100%',
                  height: 220,
                }}
              />
            )}
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
                margin: 10,
              }}
            >
              {item.title || 'Tanpa Judul'}
            </Text>

            <Text
              style={{
                color: '#999',
                marginHorizontal: 10,
                marginBottom: 10,
              }}
            >
              📅 {new Date(item.created_at).toLocaleDateString()}
            </Text>

          </TouchableOpacity>
        )}
      />
    </View>
  );
}