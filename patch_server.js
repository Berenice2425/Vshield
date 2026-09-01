import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const helperStr = `function isTransientGeminiError(error: any): boolean {
  if (!error) return false;
  
  const status = error.status || error.statusCode || error.code || error.response?.status;
  const message = (typeof error.message === 'string' ? error.message : "").toLowerCase();
  let nestedCode;
  
  try {
    if (error.message && typeof error.message === 'string' && error.message.startsWith('{')) {
      const parsed = JSON.parse(error.message);
      nestedCode = parsed.error?.code || parsed.code;
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  const rawString = (() => {
    try {
      return JSON.stringify(error).toLowerCase();
    } catch {
      return "";
    }
  })();
  
  const isTransientStatus = status === 429 || status === 503 || nestedCode === 429 || nestedCode === 503;
  const isTransientMessage = message.includes("429") || message.includes("503") || 
                             message.includes("high demand") || message.includes("overloaded") || 
                             message.includes("resource_exhausted") || message.includes("unavailable") ||
                             message.includes("too many requests") || message.includes("temporarily");
  const isTransientRaw = rawString.includes("429") || rawString.includes("503") || rawString.includes("resource_exhausted") || rawString.includes("unavailable");
  
  return Boolean(isTransientStatus || isTransientMessage || isTransientRaw);
}

const authMiddleware =`;

content = content.replace(/const authMiddleware =/, helperStr);

const oldCatchStr = `        } catch (error: any) {
          const status = error?.status || error?.response?.status;
          const errorMessage = error?.message?.toLowerCase() || "";
          const rawError = JSON.stringify(error) || "";
          
          const isTransient = status === 429 || status === 503 || 
                             errorMessage.includes("429") || errorMessage.includes("503") || 
                             errorMessage.includes("high demand") || errorMessage.includes("overloaded") || 
                             errorMessage.includes("resource_exhausted") || errorMessage.includes("unavailable") ||
                             errorMessage.includes("too many requests") || errorMessage.includes("temporarily") ||
                             rawError.includes("503") || rawError.includes("429");
          
          if (!isTransient) {
            throw error; // Bubble up permanent error
          }`;

const newCatchStr = `        } catch (error: any) {
          if (!isTransientGeminiError(error)) {
            throw error; // Bubble up permanent error
          }`;

content = content.replace(oldCatchStr, newCatchStr);

fs.writeFileSync('server.ts', content);
