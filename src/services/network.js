import NetInfo from '@react-native-community/netinfo';

export const isOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return Boolean(state?.isConnected);
  } catch (error) {
    // If NetInfo fails, be conservative and assume offline to prevent unintended sync calls.
    return false;
  }
};
