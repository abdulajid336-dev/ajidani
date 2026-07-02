import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { supabase } from './Supabase';

export default function AdminDeleteScreen({
  route,
}) {
  const { category } = route.params;

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getPosts();
  }, []);

  async function getPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('category', category)
      .order('id', {
        ascending: false,
      });

    if (!error) {
      setPosts(data || []);
    }
  }

  async function deletePost(item) {
    Alert.alert(
      'Hapus Postingan',
      'Yakin ingin menghapus foto ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',

          onPress: async () => {
            const fileName =
              item.image_url.split('/').pop();

            await supabase.storage
              .from('posts')
              .remove([fileName]);
            await supabase
              .from('comments')
              .delete()
              .eq('post_id', item.id);

            await supabase
              .from('likes')
              .delete()
              .eq('post_id', item.id);

            const { data, error } =
              await supabase
                .from('posts')
                .delete()
                .eq('id', item.id)
                .select();

            if (error) {
              alert(error.message);
              return;
            }

            setPosts(
              posts.filter(
                (p) => p.id !== item.id
              )
            );

            alert('Berhasil dihapus');
          },
        },
      ]
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#121212',
        padding: 10,
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 22,
          fontWeight: 'bold',
          marginBottom: 15,
        }}
      >
        Hapus Foto
      </Text>

      <FlatList
        data={posts}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: 12,
              marginBottom: 15,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{
                uri: item.image_url,
              }}
              style={{
                width: '100%',
                height: 220,
              }}
            />

            <View
              style={{
                padding: 10,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {item.title ||
                  'Tanpa Judul'}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  deletePost(item)
                }
                style={{
                  backgroundColor: 'red',
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  🗑 Hapus
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}