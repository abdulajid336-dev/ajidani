import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import RegisterScreen from './screens/RegisterScreen';

import { supabase } from './screens/Supabase';
import SearchScreen from './screens/SearchScreen';
import UploadScreen from './screens/UploadScreen';
import InboxScreen from './screens/InboxScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminMenuScreen from './screens/AdminMenuScreen';
import AdminUploadScreen from './screens/AdminUploadScreen';
import DetailPostScreen from './screens/DetailPostScreen';
import CategoryScreen from './screens/CategoryScreen';
import CommentsScreen from './screens/CommentsScreen';
import AdminCategoryScreen from './screens/AdminCategoryScreen';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AdminDeleteScreen from './screens/AdminDeleteScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
function MainTabs({ isAdmin }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Search') {
            iconName = 'search';
          } else if (route.name === 'Upload') {
            iconName = 'add-circle';
          } else if (route.name === 'Inbox') {
            iconName = 'chatbubble';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else if (route.name === 'Admin') {
            iconName = 'shield-checkmark';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },

        tabBarActiveTintColor: '#00ff88',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#222',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Home', {
              resetHome: Date.now(),
            });
          },
        })}
      />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminMenuScreen}
        />
      )}
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('user_id', session.user.id)
            .single();

          setIsAdmin(data?.is_admin === true);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', session.user.id)
        .single();

      setIsAdmin(data?.is_admin === true);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Main">
              {() => <MainTabs isAdmin={isAdmin} />}
            </Stack.Screen>

            <Stack.Screen
              name="AdminUpload"
              component={AdminUploadScreen}
            />
            <Stack.Screen
              name="AdminCategory"
              component={AdminCategoryScreen}
            />
            <Stack.Screen
              name="AdminDelete"
              component={AdminDeleteScreen}
            />
            <Stack.Screen
              name="Category"
              component={CategoryScreen}
            />
            <Stack.Screen
              name="DetailPost"
              component={DetailPostScreen}
            />
            <Stack.Screen
              name="Comments"
              component={CommentsScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}