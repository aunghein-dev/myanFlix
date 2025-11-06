// global.d.ts

/**
 * Defines the shape of the command object pushed to the AdProvider array.
 */
interface AdServeCommand {
  // FIX: Use Record<string, never> to satisfy the linter and explicitly
  // state that the 'serve' object should be empty.
  serve: Record<string, never>; 
}

/**
 * Extends the global Window interface to include the custom AdProvider property.
 */
interface Window {
  AdProvider?: AdServeCommand[];
}