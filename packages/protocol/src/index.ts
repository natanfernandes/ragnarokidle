export * from './auth';
export * from './client-messages';
export * from './server-messages';

export const GAME_SOCKET_PATH = '/game';
/** Close code for a game socket opened without a valid session. */
export const UNAUTHENTICATED_CLOSE_CODE = 4401;
export const SPRITE_ASSET_PATH = '/assets/render';
