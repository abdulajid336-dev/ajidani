import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

export default function AdminCategoryScreen({
  route,
  navigation,
}) {
  const { title, category } = route.params;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 22,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 40,
        }}
      >
        {title}
      </Text>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate(
            'AdminUpload',
            {
              category,
            }
          )
        }
        style={{
          backgroundColor: '#0f3460',
          padding: 15,
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          📤 Upload Foto
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate(
            'AdminDelete',
            {
              category,
            }
          )
        }
        style={{
          backgroundColor: '#b71c1c',
          padding: 15,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          🗑 Hapus Foto
        </Text>
      </TouchableOpacity>
    </View>
  );
}