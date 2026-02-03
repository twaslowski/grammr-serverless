import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { BookOpenCheck, ChevronDownIcon, Code2 } from "lucide-react";

import { Footer } from "@/components/footer";
import { PageLayout } from "@/components/page-header";
import StyledLink from "@/components/styled-link";

type FAQItem = {
  question: string;
  answer: React.ReactNode;
};

type FAQSectionProps = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: FAQItem[];
};

const generalFaqs: FAQItem[] = [
  {
    question: "What is Grammr?",
    answer: (
      <p>
        grammr makes it easy for you to understand the rules of different
        languages. It helps you study vocabulary
        <br />
        You can store any words or phrases you may learn on Flashcards for you
        to study later!
      </p>
    ),
  },
  {
    question: "How do I use Grammr?",
    answer: (
      <p>
        You can{" "}
        <StyledLink href="/dashboard/translate">translate sentences</StyledLink>{" "}
        either to or from the language you are currently learning. While
        translating, you can save words or entire phrases as Flashcards, which
        you can <StyledLink href="/dashboard/flashcards">edit</StyledLink> or{" "}
        <StyledLink href="/dashboard/study"> study</StyledLink> later.
      </p>
    ),
  },
  {
    question: "Which languages are supported?",
    answer: (
      <p>
        Currently, Russian, Spanish, Portuguese, French and Italian are
        supported.
      </p>
    ),
  },
];

const openSourceFaqs: FAQItem[] = [
  {
    question: "Is Grammr open source?",
    answer: (
      <p>
        grammr is licensed under the permissive GPLv3 license. You can find the
        source on{" "}
        <StyledLink href="https://github.com/twaslowski/grammr-serverless">
          GitHub
        </StyledLink>
        .
      </p>
    ),
  },
  {
    question: "What third-party tools are used?",
    answer: (
      <div>
        <p className="pb-4">
          grammr is built on NextJS and Supabase. For specific Natural Language
          Processing (NLP) tasks like part-of-speech tagging and the creation of
          inflection tables, I used different Python libraries. Among these are:
        </p>
        <ul className="list-disc list-inside">
          <li>
            Morphological analysis done with{" "}
            <StyledLink href={"https://spacy.io/"}>spaCy</StyledLink>
          </li>
          <li>
            Romance languages inflections done with{" "}
            <StyledLink href={"https://github.com/bretttolbert/verbecc"}>
              verbecc
            </StyledLink>
          </li>
          <li>
            Russian and Ukrainian inflections done with{" "}
            <StyledLink href={"https://github.com/no-plagiarism/pymorphy3"}>
              pymorphy3
            </StyledLink>
          </li>
        </ul>
      </div>
    ),
  },
];

export default function Help() {
  return (
    <div className="min-h-screen flex flex-col">
      <PageLayout
        header={{
          title: "Help & FAQ",
          description:
            "Get answers to common questions, ask for help or submit feedback",
          backHref: "/dashboard",
          backLabel: "Back to Dashboard",
        }}
      >
        <div>
          <FAQSection
            id="general"
            title="General Questions"
            icon={<BookOpenCheck className="text-primary mr-2" />}
            items={generalFaqs}
          />
          <FAQSection
            id="open-source"
            title="Open Source & Licensing"
            icon={<Code2 className="text-primary mr-2" />}
            items={openSourceFaqs}
          />
        </div>
      </PageLayout>

      <Footer />
    </div>
  );
}

function FAQSection({ id, title, icon, items }: FAQSectionProps) {
  return (
    <section id={id} className="mb-4">
      <div className="max-w-3xl w-full mx-auto">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          {icon}
          {title}
        </h2>
        <Accordion type="multiple" className="space-y-2">
          {items.map((item, idx) => (
            <AccordionItem key={idx} value={`${id}-item-${idx}`}>
              <AccordionTrigger className="accordion-trigger">
                <div className="flex flex-row gap-x-2 pb-2">
                  <p className="font-bold">{item.question}</p>
                  <ChevronDownIcon className="accordion-chevron" aria-hidden />
                </div>
              </AccordionTrigger>
              <AccordionContent className="max-w-lg">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
