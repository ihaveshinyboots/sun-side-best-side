from lxml import etree
import re
import math
from typing import List, Tuple
import csv

# Extract the stations and their respective coords based on the line
def extract_stations_coords(filename, regex):
    # Load the KML file
    tree = etree.parse(filename)
    # Define your regex pattern
    regex_pattern = regex

    # Compile the regex pattern
    pattern = re.compile(regex_pattern)

    # Initialize a list to store matching placemarks and their coordinates
    matching_placemarks = []

    # Find all Placemark elements regardless of their namespace
    placemarks = tree.xpath('//*[local-name()="Placemark"]')

    # Iterate through all Placemark elements
    for placemark in placemarks:
        # Find the name element within the placemark using xpath
        name_elements = placemark.xpath('.//*[local-name()="name"]')
        if name_elements:
            name_text = name_elements[0].text
            # Check if the name matches the regex pattern
            if name_text and pattern.match(name_text):
                # Find the coordinates within the placemark
                coordinates = placemark.xpath('.//*[local-name()="coordinates"]/text()')
                # Append the matching placemark and its coordinates to the list
                matching_placemarks.append((placemark, coordinates))

    stations_coords = []
    # Print or process the matching placemarks and their coordinates
    for placemark, coordinates in matching_placemarks:
        station_coord = []

        name = placemark.xpath('.//*[local-name()="name"]/text()')[0]
        station_coord.append(name.strip())
        station_coord.append(remove_trailing_zero(coordinates[0]))
        stations_coords.append(station_coord)

    return stations_coords

# Extract the line coords
def extract_coords(filename, name):
    # Load the KML file
    tree = etree.parse(filename)

    # Initialize a list to store matching placemarks and their coordinates
    matching_placemarks = []

    # Find all Placemark elements regardless of their namespace
    placemarks = tree.xpath('//*[local-name()="Placemark"]')

    # Iterate through all Placemark elements
    for placemark in placemarks:
        # Find the name element within the placemark using xpath
        name_elements = placemark.xpath('.//*[local-name()="name"]')
        if name_elements:
            name_text = name_elements[0].text
            # Check if the name matches the regex pattern
            if name_text and name==name_text:
                # Find the coordinates within the placemark
                coordinates = placemark.xpath('.//*[local-name()="coordinates"]/text()')
                # Append the matching placemark and its coordinates to the list
                matching_placemarks.append((placemark, coordinates))

    stations_coords = []
    # Print or process the matching placemarks and their coordinates
    for placemark, coordinates in matching_placemarks:
        name = placemark.xpath('.//*[local-name()="name"]/text()')[0]
        
        # Regular expression pattern to match numerical values
        pattern = r"[-+]?\d*\.\d+|\d+"
        
        for coord_str in coordinates:
            # Extract numerical values using regular expression
            matches = re.findall(pattern, coord_str)
            # Convert matched values to floats and create a coordinate tuple
            coordinate_tuples = [(float(matches[i]), float(matches[i+1])) for i in range(0, len(matches), 3)]
            # Append the coordinate tuples to the list of all coordinates
            stations_coords.extend(coordinate_tuples)

        return stations_coords
    return stations_coords

# Function to remove trailing ',0' from coordinates
def remove_trailing_zero(coordinate):
    # Trim whitespace from the coordinate string
    coordinate = coordinate.strip()
    # Check if the coordinate ends with ",0"
    if coordinate.endswith(",0"):
        # Remove the last two characters
        return coordinate[:-2]
    return coordinate

# merge both stations and coords and save it to csv
# Define the type for a named coordinate and a coordinate
NamedCoordinate = List[str]
Coordinate = Tuple[float, float]

# Helper function to calculate the Euclidean distance between two coordinates
def euclidean_distance(coord1: Coordinate, coord2: Coordinate) -> float:
    return math.sqrt((coord1[0] - coord2[0]) ** 2 + (coord1[1] - coord2[1]) ** 2)

# Check if a coordinate is between an ignore zone
def check_between(start_long, start_lat, end_long, end_lat, long, lat):
    return True

# Function to insert coordinates from set A into set B at the nearest midpoint
def insert_coordinates(station_coords: List[NamedCoordinate], coords: List[Coordinate]) -> List[str]:
    result_set = list(coords)  # Copy set B to result set B
    
    for entry in station_coords:
        name, coord_a_str = entry
        coord_a = list(map(float, coord_a_str.split(',')))
        coord_a_tuple = tuple(coord_a)
        
        # Check if the coordinate is already in result_set
        if coord_a_tuple in result_set:
            continue
        
        # Find the closest pair of coordinates in set B
        closest_index = None
        min_distance = float('inf')
        for i in range(len(result_set) - 1):
            mid_point = ((result_set[i][0] + result_set[i + 1][0]) / 2,
                         (result_set[i][1] + result_set[i + 1][1]) / 2)
            distance = euclidean_distance(coord_a_tuple, mid_point)
            if distance < min_distance:
                min_distance = distance
                closest_index = i
        
        # Insert coord_a into the closest midpoint position in result set B
        if closest_index is not None:
            result_set.insert(closest_index + 1, coord_a_tuple)
    
    # Convert result_set to the desired format
    result_set_str = []# Read ranges from CSV file
    ignore_ranges = []
    with open('ignore_range.csv', newline='') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            start_coord = (float(row[0]), float(row[1]))
            end_coord = (float(row[2]), float(row[3]))
            ignore_ranges.append((start_coord, end_coord))
    for coord in result_set:
        matched_name = None

        with open('time_from_previous.csv', newline='') as csvfile:
            time_from_prev = []
            reader = csv.reader(csvfile)
            for entry in reader:
                time_from_prev.append((entry[0], entry[1]))

            # add time from previous
            for entry in station_coords:
                if coord == tuple(map(float, entry[1].split(','))):
                    matched_name = entry[0]
                    matched_time = None
                    for station, time in time_from_prev:
                        if station in matched_name:
                            matched_time = time
                        # matched time = 2 for the first stations
                        if matched_time == "":
                            matched_time = 2
                    break
        ignore = False
        for start, end in ignore_ranges:
            try:
                start_index = result_set.index(start)
                end_index = result_set.index(end)
                coord_index = result_set.index(coord)
                ignore = start_index <= coord_index <= end_index
            except:
                continue
        
        if matched_name:
            result_set_str.append(f"{coord[0]},{coord[1]},{matched_name},{ignore},{matched_time},{1}")
        else:
            result_set_str.append(f"{coord[0]},{coord[1]},,{ignore},")
    
    return result_set_str

stations_coords = extract_stations_coords(filename="MRT Singapore.kml", regex=r'NS\d+\s\w+')

coords = extract_coords(filename="MRT Singapore.kml", name=r'NSL')

compiled_coords = insert_coordinates(stations_coords, coords)


with open('output.txt', 'w', encoding='utf-8') as txtfile:
    for item in compiled_coords:
        item_without_spaces = item.replace(", ", ",")  # Remove space after comma

        txtfile.write(item_without_spaces)
        
        txtfile.write("\n")

# Rename the text file to CSV
import os
os.rename('output.txt', 'North South Line.csv')
