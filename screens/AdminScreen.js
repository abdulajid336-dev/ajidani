import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { supabase } from './Supabase';

export default function AdminScreen() {
  const [posts, setPosts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getPosts();
    }, [])
  );

  async function getPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'pending')
      .order('id', { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setPosts(data);
  }

  async function approvePost(id) {
    await supabase
      .from('posts')
      .update({ status: 'approved' })
      .eq('id', id);

    getPosts();
  }

  async function deletePost(id) {
    await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    getPosts();
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#121212',
        padding: 15,
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 28,
          fontWeight: 'bold',
          marginBottom: 20,
          marginTop: 20,
        }}
      >
        Admin Desa
      </Text>
      <TouchableOpacity
  onPress={getPosts}
  style={{
    backgroundColor: '#00ff88',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  }}
>
  <Text
    style={{
      textAlign: 'center',
      fontWeight: 'bold',
    }}
  >
    🔄 Refresh Pending
  </Text>
</TouchableOpacity>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: 15,
              padding: 10,
              marginBottom: 20,
            }}
          >
            <Image
              source={{ uri: item.image_url }}
              style={{
                width: '100%',
                height: 250,
                borderRadius: 10,
              }}
            />

            <Text
              style={{
                color: 'white',
                marginTop: 10,
                marginBottom: 15,
              }}
            >
              {item.caption}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => approvePost(item.id)}
                style={{
                  backgroundColor: 'green',
                  padding: 12,
                  borderRadius: 10,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Approve
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deletePost(item.id)}
                style={{
                  backgroundColor: 'red',
                  padding: 12,
                  borderRadius: 10,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Hapus
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}