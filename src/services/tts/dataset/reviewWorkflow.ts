/**
 * Bhasha Setu — Phase 9: Native-Speaker Review Workflow Engine
 *
 * Implements strict review lifecycle for Santali TTS corpus prompts.
 * Enforces:
 * - Review role 'Native Santali Reviewer' without fabricating personal identities.
 * - Non-overwriting edit policy: original text is strictly preserved when edits occur.
 * - Prohibition of direct transitions from AI_DRAFT or DRAFT to RECORDING_READY.
 * - Full audit trail of review decisions.
 */

import {
  CorpusPromptItem,
  CorpusReviewStatus,
  NativeSpeakerReviewRecord,
  ReviewDecision
} from './corpusTypes';

export interface ReviewSubmissionInput {
  promptId: string;
  decision: ReviewDecision;
  meaningCorrect: boolean;
  grammarCorrect: boolean;
  orthographyCorrect: boolean;
  naturalnessCorrect: boolean;
  editedText?: string;
  pronunciationNotes?: string;
  dialectNotes?: string;
  reviewVersion?: string;
}

export interface ReviewTransitionResult {
  success: boolean;
  updatedPrompt: CorpusPromptItem;
  reviewRecord: NativeSpeakerReviewRecord;
  rejectionReason?: string;
}

export class ReviewWorkflowManager {
  private reviewHistory: Map<string, NativeSpeakerReviewRecord[]> = new Map();

  /**
   * Submit an initial candidate prompt into the review queue.
   * Prompts can NEVER enter the system directly as RECORDING_READY.
   */
  public submitCandidatePrompt(prompt: CorpusPromptItem): CorpusPromptItem {
    const clone = { ...prompt };
    
    // AI_DRAFT or DRAFT must strictly require linguistic review
    if (clone.sourceType === 'AI_DRAFT' || clone.reviewStatus === 'DRAFT') {
      clone.reviewStatus = 'LINGUISTIC_REVIEW_REQUIRED';
    } else if (clone.reviewStatus === 'RECORDING_READY') {
      // Direct insertion as RECORDING_READY without verified human review is illegal
      clone.reviewStatus = 'LINGUISTIC_REVIEW_REQUIRED';
    }

    return clone;
  }

  /**
   * Record a review decision made by a qualified 'Native Santali Reviewer'.
   * Preserves original text if changes are made.
   */
  public recordReviewDecision(
    prompt: CorpusPromptItem,
    input: ReviewSubmissionInput
  ): ReviewTransitionResult {
    const promptClone: CorpusPromptItem = { ...prompt };
    const originalText = promptClone.text;
    const reviewVersion = input.reviewVersion || 'v1.0';

    let nextStatus: CorpusReviewStatus = promptClone.reviewStatus;

    if (input.decision === 'REJECT') {
      nextStatus = 'REJECTED';
    } else if (input.decision === 'NEEDS_DISCUSSION') {
      nextStatus = 'LINGUISTIC_REVIEW_REQUIRED';
    } else if (input.decision === 'EDIT') {
      if (!input.editedText || input.editedText.trim() === '') {
        return {
          success: false,
          updatedPrompt: promptClone,
          reviewRecord: this.buildStubRecord(promptClone, input, originalText),
          rejectionReason: 'Edit decision requires non-empty editedText.'
        };
      }
      promptClone.originalTextIfEdited = originalText;
      promptClone.text = input.editedText.trim();
      promptClone.normalizedText = input.editedText.trim();
      promptClone.characterCount = promptClone.text.length;
      promptClone.wordCount = promptClone.text.split(/\s+/).filter(Boolean).length;
      promptClone.editReason = input.pronunciationNotes || 'Native reviewer corrected phrasing/orthography';
      nextStatus = 'LINGUISTIC_REVIEWED';
    } else if (input.decision === 'APPROVE') {
      // All linguistic checks must pass for APPROVE
      if (
        !input.meaningCorrect ||
        !input.grammarCorrect ||
        !input.orthographyCorrect ||
        !input.naturalnessCorrect
      ) {
        return {
          success: false,
          updatedPrompt: promptClone,
          reviewRecord: this.buildStubRecord(promptClone, input, originalText),
          rejectionReason: 'Approval requires meaning, grammar, orthography, and naturalness all marked true.'
        };
      }
      nextStatus = 'LINGUISTIC_REVIEWED';
    }

    promptClone.reviewStatus = nextStatus;

    const reviewRecord: NativeSpeakerReviewRecord = {
      reviewId: `REV-${promptClone.promptId}-${Date.now()}`,
      promptId: promptClone.promptId,
      reviewerRole: 'Native Santali Reviewer',
      decision: input.decision,
      reviewStatus: nextStatus,
      meaningCorrect: input.meaningCorrect,
      grammarCorrect: input.grammarCorrect,
      orthographyCorrect: input.orthographyCorrect,
      naturalnessCorrect: input.naturalnessCorrect,
      originalText: originalText,
      editedText: input.editedText,
      pronunciationNotes: input.pronunciationNotes,
      dialectNotes: input.dialectNotes,
      reviewDate: new Date().toISOString(),
      reviewVersion: reviewVersion
    };

    const existing = this.reviewHistory.get(promptClone.promptId) || [];
    existing.push(reviewRecord);
    this.reviewHistory.set(promptClone.promptId, existing);

    return {
      success: true,
      updatedPrompt: promptClone,
      reviewRecord
    };
  }

  /**
   * Evaluates whether a prompt can graduate to RECORDING_READY.
   * Strictly forbids unreviewed drafts or rejected items.
   */
  public promoteToRecordingReady(prompt: CorpusPromptItem): {
    canPromote: boolean;
    reason: string;
    updatedPrompt?: CorpusPromptItem;
  } {
    if (prompt.reviewStatus !== 'LINGUISTIC_REVIEWED') {
      return {
        canPromote: false,
        reason: `Cannot promote prompt ${prompt.promptId}: current status is ${prompt.reviewStatus}. Must be LINGUISTIC_REVIEWED first.`
      };
    }

    const reviews = this.reviewHistory.get(prompt.promptId) || [];
    const latestReview = reviews[reviews.length - 1];

    if (!latestReview) {
      return {
        canPromote: false,
        reason: `Cannot promote prompt ${prompt.promptId}: no native-speaker review audit trail exists.`
      };
    }

    if (
      !latestReview.meaningCorrect ||
      !latestReview.grammarCorrect ||
      !latestReview.orthographyCorrect ||
      !latestReview.naturalnessCorrect
    ) {
      return {
        canPromote: false,
        reason: `Cannot promote prompt ${prompt.promptId}: linguistic quality criteria not fully satisfied in review record.`
      };
    }

    const promoted: CorpusPromptItem = {
      ...prompt,
      reviewStatus: 'RECORDING_READY'
    };

    return {
      canPromote: true,
      reason: 'All native linguistic checks passed and review is documented.',
      updatedPrompt: promoted
    };
  }

  /**
   * Retrieves the historical review trail for a specific prompt ID.
   */
  public getReviewHistory(promptId: string): NativeSpeakerReviewRecord[] {
    return this.reviewHistory.get(promptId) || [];
  }

  private buildStubRecord(
    prompt: CorpusPromptItem,
    input: ReviewSubmissionInput,
    originalText: string
  ): NativeSpeakerReviewRecord {
    return {
      reviewId: `REV-FAILED-${prompt.promptId}`,
      promptId: prompt.promptId,
      reviewerRole: 'Native Santali Reviewer',
      decision: input.decision,
      reviewStatus: prompt.reviewStatus,
      meaningCorrect: input.meaningCorrect,
      grammarCorrect: input.grammarCorrect,
      orthographyCorrect: input.orthographyCorrect,
      naturalnessCorrect: input.naturalnessCorrect,
      originalText: originalText,
      reviewDate: new Date().toISOString(),
      reviewVersion: input.reviewVersion || 'v1.0'
    };
  }
}
