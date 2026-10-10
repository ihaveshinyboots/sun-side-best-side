import csv
import os

output_file = "output.csv"

# Function to process a single input file
def process_file(input_file, writer):
    with open(input_file, 'r') as infile:
        reader = csv.reader(infile)
        for row in reader:
            if len(row) >= 3 and row[2]:  # Checking if the row has at least 3 columns and the third column is not empty
                writer.writerow([row[2]])

# Iterate over each CSV file in the directory
input_directory = "/Users/hao/Documents/GitHub/sun-side-best-side/data/MRT"
with open(output_file, 'w', newline='') as outfile:
    writer = csv.writer(outfile)
    for filename in os.listdir(input_directory):
        if filename.endswith(".csv"):
            input_file = os.path.join(input_directory, filename)
            process_file(input_file, writer)