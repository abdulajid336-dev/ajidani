import React, {
  useState,
  useEffect,
} from 'react';

import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';

import { supabase } from './Supabase';

export default function SearchScreen({
  navigation,
}) {
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getPosts();
  }, []);

  async function getPosts() {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'approved')
      .order('id', {
        ascending: false,
      });

    setPosts(data || []);
  }

  const filteredPosts = posts.filter(
    (item) =>
      item.title
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||

      item.author_name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||

      item.caption
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#f5f7f5',
        paddingHorizontal: 15,
        paddingTop: 5,
      }}
    >

      <TextInput
        placeholder="🔍 Cari judul, nama, atau kata..."
        placeholderTextColor="#777"
        value={search}
        onChangeText={setSearch}
        style={{
          backgroundColor: 'white',
          color: '#222',
          height: 40,
          paddingHorizontal: 30,
          borderRadius: 15,
          fontSize: 15,
          marginTop: 27,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: '#dddddd',
        }}
      />

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                'DetailPost',
                {
                  post: item,
                }
              )
            }
            style={{
              backgroundColor: 'white',
              borderRadius: 15,
              marginBottom: 15,
              overflow: 'hidden',
              elevation: 2,
            }}
          >
            <Image
              source={{
                uri:
                  item.media_type === 'video'
                    ? item.thumbnail_url
                    : item.image_url,
              }}
              style={{
                width: '100%',
                height: 180,
              }}
            />

            <View
              style={{
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: '#222',
                  fontWeight: 'bold',
                  fontSize: 17,
                }}
              >
                {item.title || 'Tanpa Judul'}
              </Text>

              <Text
                style={{
                  color: '#666',
                  marginTop: 5,
                }}
              >
                👤 {item.author_name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}