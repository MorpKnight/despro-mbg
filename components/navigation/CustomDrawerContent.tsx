import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import Constants from 'expo-constants';
import React, { useState } from 'react';

import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

// Menu structure: parent dashboards with their child pages
const menuHierarchy: Record<string, string[]> = {
  'admin-dashboard': ['page1', 'page2'],
  'sekolah-dashboard': ['student-attendance', 'emergency-report', 'feedback-list'],
  'catering-dashboard': ['catering-menu-qc', 'page5', 'page6'],
  'dinkes-dashboard': ['page9', 'page10'],
};

// Helper functions
const isParent = (routeName: string) => routeName in menuHierarchy;
const isChild = (routeName: string) => Object.values(menuHierarchy).flat().includes(routeName);
const getParentOf = (childName: string) => Object.keys(menuHierarchy).find((parent) => menuHierarchy[parent].includes(childName));

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const version = Constants?.expoConfig?.version ?? (Constants as any)?.manifest?.version ?? '0.0.0';
  const { user, signOut } = useAuth();
  
  // Determine which section should be expanded based on current route
  const currentRoute = props.state.routes[props.state.index]?.name;
  const currentParent = getParentOf(currentRoute);
  
  // Auto-expand the section if we're on a child page, or if we're on a parent dashboard itself
  const autoExpandedSections = [];
  if (currentParent) {
    autoExpandedSections.push(currentParent);
  } else if (isParent(currentRoute)) {
    autoExpandedSections.push(currentRoute);
  }
  
  const [expandedSections, setExpandedSections] = useState<string[]>(autoExpandedSections);

  // Update expanded sections when route changes
  React.useEffect(() => {
    if (currentParent) {
      setExpandedSections([currentParent]);
    } else if (isParent(currentRoute)) {
      setExpandedSections([currentRoute]);
    } else {
      setExpandedSections([]);
    }
  }, [currentRoute, currentParent]);

  // Role-based menu config
  const rolePages: Record<string, string[]> = {
    'super admin': ['index', 'settings', 'admin-dashboard', 'sekolah-dashboard', 'catering-dashboard', 'dinkes-dashboard', 'page1', 'page2', 'student-attendance', 'emergency-report', 'feedback-list', 'catering-menu-qc', 'page5', 'page6', 'page9', 'page10'],
    'admin sekolah': ['index', 'settings', 'sekolah-dashboard', 'student-attendance', 'emergency-report', 'feedback-list'],
    'admin catering': ['index', 'settings', 'catering-dashboard', 'catering-menu-qc', 'page5', 'page6'],
    'siswa': ['index', 'settings', 'page7', 'page8'],
    'admin dinkes': ['index', 'settings', 'dinkes-dashboard', 'page9', 'page10'],
  };
  const allowed = user?.role ? rolePages[user.role] || ['index', 'settings'] : ['index', 'settings'];

  // Instead of filtering state/descriptors, we'll manually render drawer items with accordion
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 8, alignItems: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#1976D2', // secondary
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>MBG</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center' }}>MBG Review & Track</Text>
        <Text style={{ color: '#6B7280', textAlign: 'center' }}>v{version}</Text>
      </View>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {props.state.routes.map((route, index) => {
          if (!allowed.includes(route.name)) return null;
          
          // Skip child items - they will be rendered under their parent
          if (isChild(route.name)) {
            const parent = getParentOf(route.name);
            // Only skip if parent is also in allowed list
            if (parent && allowed.includes(parent)) return null;
          }
          
          const descriptor = props.descriptors[route.key];
          if (!descriptor) return null;
          
          const focused = index === props.state.index;
          const { title, drawerLabel, drawerIcon } = descriptor.options;
          
          // Handle drawerLabel which can be string or function
          let labelText: string = route.name;
          if (drawerLabel !== undefined) {
            labelText = typeof drawerLabel === 'function' 
              ? String(drawerLabel({ color: focused ? '#1976D2' : '#374151', focused }))
              : String(drawerLabel);
          } else if (title !== undefined) {
            labelText = String(title);
          }
          
          const isParentItem = isParent(route.name);
          const isExpanded = expandedSections.includes(route.name);
          const children = isParentItem ? menuHierarchy[route.name] : [];
          
          return (
            <View key={route.key}>
              {/* Parent or regular item */}
              <Pressable
                onPress={() => {
                  // Always navigate to the page (both parent and regular items)
                  props.navigation.navigate(route.name);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: 6,
                  marginHorizontal: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: focused ? 'rgba(25,118,210,0.08)' : 'transparent',
                }}
              >
                {drawerIcon?.({ color: focused ? '#1976D2' : '#374151', size: 24, focused })}
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 16,
                    fontWeight: focused ? '600' : '400',
                    color: focused ? '#1976D2' : '#374151',
                    flex: 1,
                  }}
                >
                  {labelText}
                </Text>
                {isParentItem && (
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                )}
              </Pressable>
              
              {/* Child items (only render if parent is expanded) */}
              {isParentItem && isExpanded && children.map((childName) => {
                if (!allowed.includes(childName)) return null;
                
                const childRoute = props.state.routes.find((r) => r.name === childName);
                if (!childRoute) return null;
                
                const childDescriptor = props.descriptors[childRoute.key];
                if (!childDescriptor) return null;
                
                const childIndex = props.state.routes.indexOf(childRoute);
                const childFocused = childIndex === props.state.index;
                const { title: childTitle, drawerLabel: childDrawerLabel, drawerIcon: childDrawerIcon } = childDescriptor.options;
                
                let childLabelText: string = childName;
                if (childDrawerLabel !== undefined) {
                  childLabelText = typeof childDrawerLabel === 'function' 
                    ? String(childDrawerLabel({ color: childFocused ? '#1976D2' : '#374151', focused: childFocused }))
                    : String(childDrawerLabel);
                } else if (childTitle !== undefined) {
                  childLabelText = String(childTitle);
                }
                
                return (
                  <Pressable
                    key={childRoute.key}
                    onPress={() => {
                      props.navigation.navigate(childName);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginVertical: 4,
                      marginHorizontal: 12,
                      marginLeft: 40, // Indent child items
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor: childFocused ? 'rgba(25,118,210,0.08)' : 'transparent',
                    }}
                  >
                    {childDrawerIcon?.({ color: childFocused ? '#1976D2' : '#9CA3AF', size: 20, focused: childFocused })}
                    <Text
                      style={{
                        marginLeft: 12,
                        fontSize: 15,
                        fontWeight: childFocused ? '600' : '400',
                        color: childFocused ? '#1976D2' : '#6B7280',
                      }}
                    >
                      {childLabelText}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </DrawerContentScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', gap: 8 }}>
        <Text style={{ color: '#6B7280', fontSize: 12 }}>Signed in as {user?.username ?? 'Guest'} ({user?.role ?? 'n/a'})</Text>
        <Button title="Log out" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}
