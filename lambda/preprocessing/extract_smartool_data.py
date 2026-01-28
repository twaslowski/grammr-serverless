import csv
import sys

"""Extracts sentences from the Smartool Corpus Data."""


def main(source_file: str, target_file: str):
    with open(source_file, "r") as f, open(target_file, "w") as t:
        reader = csv.reader(f, delimiter=",")
        for line in reader:
            phrase = line[10]
            if phrase.strip():
                t.write(f"{phrase}\n")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise ValueError("Usage: extract_smartool_data.py <source_file> <target_file>")
    source = sys.argv[1]
    target = sys.argv[2]
    main(source, target)
