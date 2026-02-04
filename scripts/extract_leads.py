import csv
import glob
import os

def get_provider(email):
    domain = email.split('@')[-1].lower()
    if 'gmail.com' in domain:
        return 'gmail'
    if any(p in domain for p in ['outlook.com', 'hotmail.com', 'live.com', 'msn.com']):
        return 'outlook'
    if 'zoho.com' in domain:
        return 'zoho'
    if 'yahoo.com' in domain:
        return 'yahoo'
    if 'icloud.com' in domain or 'me.com' in domain or 'apple.com' in domain:
        return 'apple'
    return 'other'

def main():
    emails = set()
    csv_files = glob.glob('leads/*.csv')
    
    print(f"Found {len(csv_files)} CSV files.")
    
    for file_path in csv_files:
        print(f"Processing {file_path}...")
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if not header:
                    continue
                
                # We know Email is in the 3rd column (index 2)
                for row in reader:
                    if len(row) > 2:
                        email = row[2].strip()
                        if '@' in email and '.' in email:
                            emails.add(email)
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print(f"Extracted {len(emails)} unique emails.")
    
    # Write to SQL file in chunks
    output_file = 'supabase/migrations/0011_seed_import.sql'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Migration to import scraped leads as seeds\n")
        
        email_list = list(emails)
        chunk_size = 1000
        for i in range(0, len(email_list), chunk_size):
            chunk = email_list[i:i + chunk_size]
            values = []
            for email in chunk:
                # Basic SQL escaping
                safe_email = email.replace("'", "''")
                provider = get_provider(email)
                values.append(f"('{safe_email}', '{provider}')")
            
            f.write("INSERT INTO seed_list (email, provider) VALUES\n")
            f.write(",\n".join(values))
            f.write("\nON CONFLICT (email) DO NOTHING;\n\n")

    print(f"Successfully wrote SQL to {output_file}")

if __name__ == "__main__":
    main()
