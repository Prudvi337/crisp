// BroadcastChannel for syncing state between Interviewee and Interviewer tabs
class TabSyncService {
  private channel: BroadcastChannel;
  private listeners: Set<(data: any) => void> = new Set();

  constructor(channelName: string = 'chrono-interviewer-sync') {
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (event) => {
      this.listeners.forEach(listener => listener(event.data));
    };
  }

  broadcast(type: string, data: any) {
    this.channel.postMessage({ type, data, timestamp: Date.now() });
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  close() {
    this.channel.close();
    this.listeners.clear();
  }
}

export const tabSync = new TabSyncService();

// Helper functions for common sync events
export const syncCandidateUpdate = (candidateId: string, updates: any) => {
  tabSync.broadcast('CANDIDATE_UPDATE', { candidateId, updates });
};

export const syncInterviewState = (state: any) => {
  tabSync.broadcast('INTERVIEW_STATE', state);
};

export const syncNewMessage = (candidateId: string, message: any) => {
  tabSync.broadcast('NEW_MESSAGE', { candidateId, message });
};