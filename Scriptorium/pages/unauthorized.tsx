
import { UserContext } from '@/context/UserContext';
import { useContext, useEffect, useState } from 'react';

export default function name() {
  const { user, login } = useContext(UserContext);
  return user && <div>
</div>
}