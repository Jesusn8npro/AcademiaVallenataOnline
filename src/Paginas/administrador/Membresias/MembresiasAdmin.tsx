'use client';

import * as React from 'react';
import { useState } from 'react';
import PanelSuscriptores from './PanelSuscriptores';
import GestionPlanes from './GestionPlanes';
import './MembresiasAdmin.css';

type Vista = 'suscriptores' | 'planes';

export default function MembresiasAdmin() {
  const [vista, setVista] = useState<Vista>('suscriptores');

  return (
    <div className="madm">
      <header className="madm-header">
        <div>
          <h1>💎 Membresías</h1>
          <p>Control de suscriptores, vencimientos y uso · gestión de planes</p>
        </div>
      </header>

      <div className="madm-vista-tabs">
        <button className={`madm-vista-tab ${vista === 'suscriptores' ? 'activa' : ''}`} onClick={() => setVista('suscriptores')}>
          👥 Suscriptores
        </button>
        <button className={`madm-vista-tab ${vista === 'planes' ? 'activa' : ''}`} onClick={() => setVista('planes')}>
          🗂️ Planes
        </button>
      </div>

      {vista === 'suscriptores' ? <PanelSuscriptores /> : <GestionPlanes />}
    </div>
  );
}
