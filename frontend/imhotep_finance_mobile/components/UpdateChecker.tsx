import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { Paths, File, Directory } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';

// GitHub repository info
const GITHUB_OWNER = 'Imhotep-Tech';
const GITHUB_REPO = 'imhotep_finance';
const APK_ASSET_NAME = 'imhotep-finance.apk';

// Storage keys
const SKIP_VERSION_KEY = 'update_checker_skip_version';
const LAST_CHECK_KEY = 'update_checker_last_check';
const CHECK_INTERVAL = 1000 * 60 * 60 * 6; // 6 hours

// Theme colors
const themes = {
  light: {
    overlay: 'rgba(0, 0, 0, 0.6)',
    background: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#2563EB',
    primaryPressed: '#1D4ED8',
    secondary: '#F3F4F6',
    secondaryPressed: '#E5E7EB',
    secondaryText: '#374151',
    success: '#16A34A',
    border: '#E5E7EB',
  },
  dark: {
    overlay: 'rgba(0, 0, 0, 0.8)',
    background: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    primary: '#3B82F6',
    primaryPressed: '#2563EB',
    secondary: '#374151',
    secondaryPressed: '#4B5563',
    secondaryText: '#D1D5DB',
    success: '#22C55E',
    border: '#374151',
  },
};

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  assets: {
    name: string;
    browser_download_url: string;
    size: number;
  }[];
  published_at: string;
}

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  releaseName: string;
  fileSize: number;
}

/**
 * Compare two semantic version strings.
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const normalize = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const parts1 = normalize(v1);
  const parts2 = normalize(v2);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function UpdateChecker() {
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const [showModal, setShowModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    if (__DEV__) return; // Don't check in development mode

    try {
      // Check if we should skip this check (rate limiting)
      const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
      if (lastCheck) {
        const timeSinceLastCheck = Date.now() - parseInt(lastCheck, 10);
        if (timeSinceLastCheck < CHECK_INTERVAL) {
          console.log('Skipping update check - checked recently');
          return;
        }
      }

      // Save the check timestamp
      await AsyncStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

      // 1. Check for Silent JS/OTA Updates (EAS Update)
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log('OTA update available, downloading...');
          await Updates.fetchUpdateAsync();
          // Let it apply on next app launch for a smoother experience
          // Or force reload with: await Updates.reloadAsync();
        }
      } catch (otaError) {
        console.log('OTA update check failed (this is normal in dev builds)', otaError);
      }

      // 2. Check for Native/APK Updates from GitHub (Android only)
      if (Platform.OS === 'android') {
        await checkGitHubRelease();
      }
    } catch (error) {
      console.log('Update check failed:', error);
    }
  };

  const checkGitHubRelease = async () => {
    try {
      // Fetch latest release from GitHub API
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        console.log('GitHub API request failed:', response.status);
        return;
      }

      const release: GitHubRelease = await response.json();
      const latestVersion = release.tag_name.replace(/^v/, '');
      const currentVersion = Application.nativeApplicationVersion || '0.0.0';

      console.log(`Current version: ${currentVersion}, Latest: ${latestVersion}`);

      // Check if update is available (latest > current)
      if (compareVersions(latestVersion, currentVersion) <= 0) {
        console.log('App is up to date');
        return;
      }

      // Check if user has skipped this version
      const skippedVersion = await AsyncStorage.getItem(SKIP_VERSION_KEY);
      if (skippedVersion === latestVersion) {
        console.log(`User skipped version ${latestVersion}`);
        return;
      }

      // Find the APK asset
      const apkAsset = release.assets.find(
        (asset) => asset.name.toLowerCase() === APK_ASSET_NAME.toLowerCase() ||
                   asset.name.toLowerCase().endsWith('.apk')
      );

      if (!apkAsset) {
        console.log('No APK found in release assets');
        return;
      }

      setUpdateInfo({
        version: latestVersion,
        downloadUrl: apkAsset.browser_download_url,
        releaseNotes: release.body || 'Bug fixes and improvements',
        releaseName: release.name || `Version ${latestVersion}`,
        fileSize: apkAsset.size,
      });
      setShowModal(true);
    } catch (error) {
      console.log('Failed to check GitHub release:', error);
    }
  };

  const downloadAndInstallApk = useCallback(async () => {
    if (!updateInfo) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadError(null);

    try {
      const fileName = `imhotep-finance-${updateInfo.version}.apk`;
      
      const apkFile = new File(Paths.cache, fileName);
      
      if (apkFile.exists) {
        await apkFile.delete();
      }

      const downloadResumable = LegacyFileSystem.createDownloadResumable(
        updateInfo.downloadUrl,
        apkFile.uri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(Math.round(progress * 100));
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        throw new Error('Download failed - no file URI');
      }

      console.log('APK downloaded to:', result.uri);
      setDownloadProgress(100);

      // Convert file:// URI to content:// URI for Android 7.0+
      const contentUri = await LegacyFileSystem.getContentUriAsync(result.uri);
      
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      });

      setShowModal(false);
      setIsDownloading(false);
    } catch (error: any) {
      console.error('Download/Install failed:', error);
      setDownloadError(error.message || 'Download failed. Please try again.');
      setIsDownloading(false);
    }
  }, [updateInfo]);

  const handleSkipVersion = async () => {
    if (updateInfo) {
      await AsyncStorage.setItem(SKIP_VERSION_KEY, updateInfo.version);
    }
    setShowModal(false);
  };

  const handleLater = () => {
    setShowModal(false);
  };

  if (!showModal || !updateInfo) return null;

  return (
    <Modal transparent animationType="fade" visible={showModal}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🚀</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Update Available!
            </Text>
            <Text style={[styles.version, { color: colors.primary }]}>
              Version {updateInfo.version}
            </Text>
          </View>

          {/* Release Info */}
          <View style={[styles.releaseInfo, { borderColor: colors.border }]}>
            <Text style={[styles.releaseName, { color: colors.text }]}>
              {updateInfo.releaseName}
            </Text>
            <Text style={[styles.releaseNotes, { color: colors.textSecondary }]} numberOfLines={4}>
              {updateInfo.releaseNotes}
            </Text>
            <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
              Download size: {formatBytes(updateInfo.fileSize)}
            </Text>
          </View>

          {/* Download Progress */}
          {isDownloading && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${downloadProgress ?? 0}%` as `${number}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {downloadProgress}% - Downloading update...
              </Text>
            </View>
          )}

          {/* Error Message */}
          {downloadError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{downloadError}</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {!isDownloading ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={downloadAndInstallApk}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>
                    📥 Download & Install
                  </Text>
                </TouchableOpacity>

                <View style={styles.secondaryButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton, { backgroundColor: colors.secondary }]}
                    onPress={handleLater}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.secondaryText }]}>
                      Later
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton, { backgroundColor: colors.secondary }]}
                    onPress={handleSkipVersion}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.secondaryButtonText, { color: colors.secondaryText }]}>
                      Skip Version
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            )}
          </View>

          {/* Note about data preservation */}
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            ✓ Your data will be preserved during the update
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  version: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  releaseInfo: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  releaseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  releaseNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  fileSize: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    paddingVertical: 14,
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});