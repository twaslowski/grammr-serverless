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
      <div className="space-y-2">
        <p>
          grammr makes it easy for you to understand the rules of different
          languages. It helps you study vocabulary effectively and build your
          language skills.
        </p>
        <p>
          You can store any words or phrases you learn on Flashcards to study
          later and track your progress over time.
        </p>
      </div>
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
      <div className="space-y-3">
        <p>
          grammr is built on NextJS and Supabase. For specific Natural Language
          Processing (NLP) tasks like part-of-speech tagging and the creation of
          inflection tables, I used different Python libraries. Among these are:
        </p>
        <ul className="space-y-2 pl-4">
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            <span>
              Morphological analysis done with{" "}
              <StyledLink href={"https://spacy.io/"}>spaCy</StyledLink>
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            <span>
              Romance languages inflections done with{" "}
              <StyledLink href={"https://github.com/bretttolbert/verbecc"}>
                verbecc
              </StyledLink>
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-primary mr-2">•</span>
            <span>
              Russian and Ukrainian inflections done with{" "}
              <StyledLink href={"https://github.com/no-plagiarism/pymorphy3"}>
                pymorphy3
              </StyledLink>
            </span>
          </li>
        </ul>
      </div>
    ),
  },
];

export default function Help() {
  return (
    <PageLayout
      header={{
        title: "Help & FAQ",
        description:
          "Get answers to common questions, ask for help or submit feedback",
        backHref: "/dashboard",
        backLabel: "Back to Dashboard",
      }}
    >
      <div className="space-y-12">
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
        <div className="pt-12" />
        <Footer />
      </div>
    </PageLayout>
  );
}

function FAQSection({ id, title, icon, items }: FAQSectionProps) {
  return (
    <section id={id} className="mb-8">
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        {icon}
        {title}
      </h2>
      <Accordion type="multiple" className="space-y-4">
        {items.map((item, idx) => (
          <AccordionItem
            key={idx}
            value={`${id}-item-${idx}`}
            className="border border-border rounded-lg bg-card shadow-sm overflow-hidden transition-all hover:shadow-md"
          >
            <AccordionTrigger className="accordion-trigger w-full text-left">
              <div className="flex justify-between items-center w-full px-6 py-4 gap-x-4 hover:bg-accent/50 transition-colors">
                <p className="font-semibold text-lg">{item.question}</p>
                <ChevronDownIcon
                  className="accordion-chevron flex-shrink-0 h-5 w-5 text-muted-foreground"
                  aria-hidden
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2 text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
