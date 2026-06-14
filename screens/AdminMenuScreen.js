import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

export default function AdminMenuScreen({ navigation }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
      }}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 28,
          fontWeight: 'bold',
          marginBottom: 30,
        }}
      >
        Admin Desa
      </Text>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('AdminCategory', {
            title: 'Profil Desa',
            category: 'profil_desa',
          })
        }
        style={menuStyle}
      >
        <Text style={textStyle}>📁 Profil Desa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('AdminCategory', {
            title: 'Pengumuman',
            category: 'pengumuman',
          })
        }
        style={menuStyle}
      >
        <Text style={textStyle}>📢 Pengumuman</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('AdminCategory', {
            title: 'Dok Pembangunan',
            category: 'pembangunan',
          })
        }
        style={menuStyle}
      >
        <Text style={textStyle}>🏗 Dok Pembangunan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('AdminCategory', {
            title: 'Dok Kegdes',
            category: 'dok_desa',
          })
        }
        style={menuStyle}
      >
        <Text style={textStyle}>🏛 Dok Kegdes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('AdminCategory', {
            title: 'Seni & Budaya',
            category: 'seni_budaya',
          })
        }
        style={menuStyle}
      >
        <Text style={textStyle}>🎭 Seni & Budaya</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('AdminCategory', {
            title: 'Dok Kegmas',
            category: 'dok_masyarakat',
          })
        }
        style={menuStyle}
      >
        <Text style={textStyle}>👥 Dok Kegmas</Text>
      </TouchableOpacity>
    </View>
  );
}

const menuStyle = {
  backgroundColor: '#1e1e1e',
  padding: 18,
  borderRadius: 12,
  marginBottom: 15,
};

const textStyle = {
  color: 'white',
  fontSize: 18,
  fontWeight: 'bold',
};