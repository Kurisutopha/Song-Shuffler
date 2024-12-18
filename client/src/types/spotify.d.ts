interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
      }) => Spotify.Player;
    }
  }
  
  declare namespace Spotify {
    interface Player {
      connect(): Promise<boolean>;
      disconnect(): void;
      addListener(event: string, callback: (evt?: any) => void): void;
      removeListener(event: string, callback: (evt?: any) => void): void;
      getCurrentState(): Promise<any>;
      setVolume(volume: number): Promise<void>;
      pause(): Promise<void>;
      resume(): Promise<void>;
      getVolume(): Promise<number>;
    }
  }