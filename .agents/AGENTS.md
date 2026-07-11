
# Global Synchronization Rule

- **Move in Sync**: When making changes, always check and ensure synchronization across the backend, web frontend, and mobile app. Do not make changes to one without verifying the impact on the others.

# Mobile Deployment Instructions

- **EAS OTA Updates**: The mobile app's production build profile is configured with the `production` update channel. Always deploy updates to the mobile app's production channel in future sessions using:
  ```bash
  eas update --branch production --message "your message"
  ```
