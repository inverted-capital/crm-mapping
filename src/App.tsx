import React from 'react';
import { MapContainer } from './components/MapContainer';
import { AppHeader } from './components/AppHeader';
import { Layout } from './components/Layout';

function App() {
  return (
    <Layout>
      <AppHeader />
      <MapContainer />
    </Layout>
  );
}

export default App;