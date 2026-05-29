"use client";
// Evidence 문서 선택 상태와 편집기를 클라이언트에서 관리한다.
import { useMemo, useState } from "react";
import DocumentCoverageGrid, { type DocumentCoverageItem } from "./DocumentCoverageGrid";
import ProjectDocumentEditor from "./ProjectDocumentEditor";
import type { ProjectDocumentReadiness, ProjectDocumentType } from "@/lib/types";

interface ProjectDocumentWorkspaceItem extends DocumentCoverageItem {
  id: string | null;
  title: string;
  contentMarkdown: string;
  isPrd: boolean;
}

interface ProjectDocumentsWorkspaceProps {
  initialSelectedType: ProjectDocumentType;
  items: ProjectDocumentWorkspaceItem[];
  saveAction: (formData: FormData) => void | Promise<void>;
  createFromTemplateAction: (formData: FormData) => void | Promise<void>;
  generateDraftAction: (formData: FormData) => void | Promise<void>;
  applyAction: (formData: FormData) => void | Promise<void>;
  supersedeAction: (formData: FormData) => void | Promise<void>;
  labels: {
    applied: string;
    notApplied: string;
    updated: string;
    noContent: string;
    title: string;
    body: string;
    save: string;
    createFromTemplate: string;
    generateDraft: string;
    generatingDraft: string;
    apply: string;
    exclude: string;
    supersede: string;
    appliedState: string;
    prdAlwaysApplied: string;
    analysisSignals: string;
    emptyHint: string;
    unsavedDraftHint: string;
    readiness: Record<ProjectDocumentReadiness, string>;
  };
}

export default function ProjectDocumentsWorkspace({
  initialSelectedType,
  items,
  saveAction,
  createFromTemplateAction,
  generateDraftAction,
  applyAction,
  supersedeAction,
  labels,
}: ProjectDocumentsWorkspaceProps) {
  const initialType = items.some((item) => item.type === initialSelectedType)
    ? initialSelectedType
    : items[0]?.type;
  const [selectedType, setSelectedType] = useState<ProjectDocumentType>(initialType ?? "prd");
  const selectedDocument = useMemo(
    () => items.find((item) => item.type === selectedType) ?? items[0],
    [items, selectedType]
  );

  if (!selectedDocument) {
    return null;
  }

  return (
    <>
      <section className="mb-6">
        <DocumentCoverageGrid
          selectedType={selectedDocument.type}
          items={items}
          labels={{
            applied: labels.applied,
            notApplied: labels.notApplied,
            updated: labels.updated,
            noContent: labels.noContent,
            readiness: labels.readiness,
          }}
          onSelect={setSelectedType}
        />
      </section>

      <ProjectDocumentEditor
        key={selectedDocument.type}
        documentType={selectedDocument.type}
        documentId={selectedDocument.id}
        title={selectedDocument.title}
        contentMarkdown={selectedDocument.contentMarkdown}
        label={selectedDocument.label}
        description={selectedDocument.description}
        readiness={selectedDocument.readiness}
        isApplied={selectedDocument.isApplied}
        isPrd={selectedDocument.isPrd}
        signals={selectedDocument.signals}
        saveAction={saveAction}
        createFromTemplateAction={createFromTemplateAction}
        generateDraftAction={generateDraftAction}
        applyAction={applyAction}
        supersedeAction={supersedeAction}
        labels={{
          title: labels.title,
          body: labels.body,
          save: labels.save,
          createFromTemplate: labels.createFromTemplate,
          generateDraft: labels.generateDraft,
          generatingDraft: labels.generatingDraft,
          apply: labels.apply,
          exclude: labels.exclude,
          supersede: labels.supersede,
          applied: labels.appliedState,
          prdAlwaysApplied: labels.prdAlwaysApplied,
          analysisSignals: labels.analysisSignals,
          readiness: labels.readiness,
          emptyHint: selectedDocument.id ? labels.emptyHint : labels.unsavedDraftHint,
        }}
      />
    </>
  );
}
