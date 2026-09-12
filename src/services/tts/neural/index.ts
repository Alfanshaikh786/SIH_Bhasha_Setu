/**
 * Bhasha Setu — Phase 6: Native Neural TTS Model-Ready Architecture
 * 
 * Public API for Neural TTS subsystem:
 * - Types and interfaces (INeuralTTSAdapter, NeuralTTSRequest, NeuralTTSResult)
 * - TTS Model Registry & versioning
 * - Deterministic Capability Resolver
 * - Audio format & normalization contracts
 * - Speech data ethics, provenance, and partition validator
 * - Neural TTS Adapter implementation
 */

export * from './types';
export * from './modelRegistry';
export * from './capabilityResolver';
export * from './audioNormalization';
export * from './dataEthicsContract';
export * from './neuralAdapter';
