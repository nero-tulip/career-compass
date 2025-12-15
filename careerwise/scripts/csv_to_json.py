import pandas as pd
import json
import os
import tkinter as tk
from tkinter import filedialog

def select_input_file():
    """Opens a dialog to select the input CSV file."""
    root = tk.Tk()
    root.withdraw() # Hide the main window
    file_path = filedialog.askopenfilename(
        title="Select your merged CSV file",
        filetypes=[("CSV files", "*.csv"), ("All files", "*.*")]
    )
    return file_path

def select_output_file():
    """Opens a dialog to save the output JSON file."""
    root = tk.Tk()
    root.withdraw()
    file_path = filedialog.asksaveasfilename(
        title="Save JSON file as...",
        defaultextension=".json",
        filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
        initialfile="career_compass_data.json"
    )
    return file_path

def create_nested_structure(row):
    """
    Transforms a flat CSV row into a nested JSON object.
    Groups columns like 'Skills_Mathematics' into:
    "attributes": { "Skills": [ { "name": "Mathematics", "score": 4.5 } ] }
    """
    # 1. Base Job Information
    job_data = {
        "id": row['O*NET-SOC Code'],
        "title": row['Title'],
        "description": row['Description'],
        "job_zone": row['Job Zone'],
        "attributes": {}
    }
    
    # 2. Iterate through columns to find attributes (Skills, Knowledge, etc.)
    for col in row.index:
        # We look for columns with an underscore, e.g., "Knowledge_Biology"
        if "_" in col:
            parts = col.split("_", 1)
            
            # Ensure it splits into exactly [Category, Name]
            if len(parts) == 2:
                category, name = parts
                
                # Create the category list if it doesn't exist yet
                if category not in job_data['attributes']:
                    job_data['attributes'][category] = []
                
                # Add the item ONLY if it has a valid score (greater than 0)
                # We round to 2 decimal places to save space
                val = row[col]
                if pd.notnull(val) and isinstance(val, (int, float)) and val > 0:
                    job_data['attributes'][category].append({
                        "name": name,
                        "score": round(val, 2)
                    })
    
    # 3. Sort attributes by score (highest first) for easier display later
    for cat in job_data['attributes']:
        job_data['attributes'][cat] = sorted(
            job_data['attributes'][cat], 
            key=lambda x: x['score'], 
            reverse=True
        )

    return job_data

def main():
    print("Please select your input CSV file...")
    input_file = select_input_file()
    
    if not input_file:
        print("No input file selected. Exiting.")
        return

    print("Please select where to save the output JSON file...")
    output_file = select_output_file()
    
    if not output_file:
        print("No output file selected. Exiting.")
        return

    print(f"Reading {os.path.basename(input_file)}...")
    try:
        df = pd.read_csv(input_file)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    print("Converting to JSON structure (this may take a moment)...")
    # Apply the function to every row
    json_output = df.apply(create_nested_structure, axis=1).tolist()

    print(f"Saving to {os.path.basename(output_file)}...")
    with open(output_file, 'w') as f:
        json.dump(json_output, f, indent=2)

    print(f"Success! Saved to: {output_file}")

if __name__ == "__main__":
    main()