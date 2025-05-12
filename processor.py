import pandas as pd
import os
import re
from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive

# Authenticate and create PyDrive client
gauth = GoogleAuth()
gauth.LocalWebserverAuth()  # opens browser for login
drive = GoogleDrive(gauth)

# Load Excel file
df = pd.read_excel("secondary 2025.xlsx")  # Update path as needed

# Column references
photo_link_column = "STUDENT'S PASSPORT SIZE PHOTO (In School uniform)"
sr_number_column = df.columns[0]  # Assuming column A is the serial number
class_div_column = "CURRENT CLASS & DIV (2025-2026)"

# Base folder for downloads
base_download_folder = "student_photos"
os.makedirs(base_download_folder, exist_ok=True)

# Function to extract Google Drive file ID from URL
def extract_drive_id(url):
    match = re.search(r'id=([^&]+)', str(url))
    return match.group(1) if match else None

# Iterate over rows and download photos
for idx, row in df.iterrows():
    sr_number = str(row[sr_number_column]).strip()
    photo_link = row[photo_link_column]
    class_div = str(row[class_div_column]).strip().replace("/", "-")  # Avoid invalid folder names

    # Create subfolder for class/div
    folder_path = os.path.join(base_download_folder, class_div)
    os.makedirs(folder_path, exist_ok=True)

    file_id = extract_drive_id(photo_link)

    if file_id:
        try:
            file = drive.CreateFile({'id': file_id})
            file_path = os.path.join(folder_path, f"{sr_number}.jpg")
            file.GetContentFile(file_path)
            print(f"Downloaded: {file_path}")
        except Exception as e:
            print(f"Error downloading SR {sr_number}: {e}")
    else:
        print(f"Invalid URL for SR {sr_number}")
