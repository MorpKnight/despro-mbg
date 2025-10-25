import { Stack } from 'expo-router';
import React from 'react';
import { MenuQCForm } from '../../components/features/catering';

export default function CateringMenuQCPage() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Input Menu Harian & QC',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <MenuQCForm />
    </>
  );
}
