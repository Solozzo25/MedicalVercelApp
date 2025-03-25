'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function UserProfile({ userName = "Dr Dariusz Okal", userRole = "Lekarz rodzinny" }) {
  // Możliwość dodania funkcjonalności zarządzania profilem w przyszłości
  return (
    <div className="user-profile">
      <Image 
        src="https://randomuser.me/api/portraits/women/65.jpg" 
        alt="Profile" 
        width={36} 
        height={36} 
        style={{ borderRadius: '50%', objectFit: 'cover' }}
      />
      <div className="user-info">
        <h5>{userName}</h5>
        <p>{userRole}</p>
      </div>
    </div>
  );
}
