import csv
import sys

"""Extracts sentences from the Smartool Corpus Data."""


def main(source_file: str, target_file: str):
    with open(source_file, "r") as f, open(target_file, "w") as t:
        reader = csv.reader(f, delimiter=",")
        writer = csv.writer(t, delimiter="|")
        for line in reader:
            phrase = line[10]
            translation = line[11]
            if phrase.strip():
                writer.writerow([phrase, translation])


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise ValueError("Usage: extract_smartool_data.py <source_file> <target_file>")
    source = sys.argv[1]
    target = sys.argv[2]
    main(source, target)
