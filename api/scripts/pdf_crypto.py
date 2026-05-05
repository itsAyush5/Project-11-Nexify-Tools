import sys
import os
from pypdf import PdfReader, PdfWriter

def encrypt_pdf(input_path, output_path, password):
    writer = PdfWriter()
    try:
        reader = PdfReader(input_path)
        writer.append_pages_from_reader(reader)
        writer.encrypt(password)
        with open(output_path, "wb") as f:
            writer.write(f)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")

def decrypt_pdf(input_path, output_path, password):
    writer = PdfWriter()
    try:
        reader = PdfReader(input_path)
        if reader.is_encrypted:
            if reader.decrypt(password) == 0:
                print("ERROR: Incorrect password")
                return
        writer.append_pages_from_reader(reader)
        with open(output_path, "wb") as f:
            writer.write(f)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("ERROR: Missing arguments")
        sys.exit(1)

    action = sys.argv[1]
    in_path = sys.argv[2]
    out_path = sys.argv[3]
    pwd = sys.argv[4]

    if not os.path.exists(in_path):
        print(f"ERROR: File not found: {in_path}")
        sys.exit(1)

    if action == "encrypt":
        encrypt_pdf(in_path, out_path, pwd)
    elif action == "decrypt":
        decrypt_pdf(in_path, out_path, pwd)
    else:
        print(f"ERROR: Unknown action: {action}")
        sys.exit(1)
