// LocalStorage Authentication & User Data Persistence Service

export interface StoredUser {
  email: string;
  password?: string;
  name?: string;
  role?: string;
  createdAt: string;
}

const REGISTERED_USERS_KEY = 'adivaani_registered_users';
const CURRENT_USER_KEY = 'adivaani_current_user';
const REMEMBERED_CREDENTIALS_KEY = 'adivaani_remembered_credentials';

// Initialize with default admin/demo accounts if empty
export const initAuthStorage = (): StoredUser[] => {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) {
      const defaultUsers: StoredUser[] = [
        {
          email: 'alfanshaikh902@gmail.com',
          password: 'password123',
          name: 'Alfan Shaikh',
          role: 'Administrator',
          createdAt: new Date().toISOString()
        },
        {
          email: 'demo@adivaani.in',
          password: 'password123',
          name: 'Tribal Researcher',
          role: 'Contributor',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Auth storage init error:', e);
    return [];
  }
};

export const getStoredUsers = (): StoredUser[] => {
  return initAuthStorage();
};

export const registerUser = (email: string, password: string, name?: string): { success: boolean; message: string; user?: StoredUser } => {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return { success: false, message: 'An account with this email address already exists.' };
  }

  const newUser: StoredUser = {
    email: normalizedEmail,
    password: password,
    name: name || normalizedEmail.split('@')[0],
    role: 'Contributor',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ email: newUser.email, name: newUser.name, role: newUser.role }));

  return { success: true, message: 'Account registered and securely saved in LocalStorage!', user: newUser };
};

export const loginUser = (email: string, password: string): { success: boolean; message: string; user?: StoredUser } => {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    // If not found, automatically register them so user can easily sign in with any credentials!
    const autoCreated: StoredUser = {
      email: normalizedEmail,
      password: password,
      name: normalizedEmail.split('@')[0],
      role: 'Contributor',
      createdAt: new Date().toISOString()
    };
    users.push(autoCreated);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ email: autoCreated.email, name: autoCreated.name, role: autoCreated.role }));
    return { success: true, message: 'Signed in successfully! New account details saved in LocalStorage.', user: autoCreated };
  }

  if (user.password && user.password !== password) {
    return { success: false, message: 'Incorrect password. Please verify your credentials.' };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ email: user.email, name: user.name, role: user.role }));
  return { success: true, message: 'Signed in successfully! Details loaded from LocalStorage.', user };
};

export const getCurrentUser = (): { email: string; name: string; role: string } | null => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getRememberedCredentials = (): { email: string; password?: string; remember: boolean } => {
  try {
    const raw = localStorage.getItem(REMEMBERED_CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : { email: '', password: '', remember: false };
  } catch {
    return { email: '', password: '', remember: false };
  }
};

export const saveRememberedCredentials = (email: string, password?: string, remember: boolean = true): void => {
  if (remember) {
    localStorage.setItem(REMEMBERED_CREDENTIALS_KEY, JSON.stringify({ email, password, remember }));
  } else {
    localStorage.removeItem(REMEMBERED_CREDENTIALS_KEY);
  }
};
