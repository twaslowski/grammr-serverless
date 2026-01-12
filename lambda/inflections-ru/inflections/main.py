import json

from domain import Inflections, InflectionRequest
from inflections.service import feature_retriever, inflector


if __name__ == "__main__":
    with open("test.json") as f:
        body = json.loads(f.read())
        request = InflectionRequest(**body)

        features = feature_retriever.derive_features(request.part_of_speech)
        inflections = inflector.inflect(request.lemma, features)
        inflections_container = Inflections(
            part_of_speech=request.part_of_speech,
            lemma=request.lemma,
            inflections=inflections,
        )
        print(json.dumps(inflections_container.json(), indent=4))
