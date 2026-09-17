/**
 * High-performance vector math operations for semantic similarity calculations.
 */
export class VectorMath {
  /**
   * Computes the dot product of two vectors of equal dimensionality.
   */
  public static dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  /**
   * Computes the Euclidean norm (L2 magnitude) of a vector.
   */
  public static magnitude(v: number[]): number {
    let sum = 0;
    for (let i = 0; i < v.length; i++) {
      sum += v[i] * v[i];
    }
    return Math.sqrt(sum);
  }

  /**
   * Normalizes a vector to unit length (L2 norm = 1.0).
   * If vector magnitude is zero, returns zero-filled vector.
   */
  public static normalize(v: number[]): number[] {
    const mag = this.magnitude(v);
    if (mag === 0 || !Number.isFinite(mag)) {
      return new Array(v.length).fill(0);
    }
    return v.map((val) => val / mag);
  }

  /**
   * Computes cosine similarity between two vectors: (A · B) / (||A|| * ||B||).
   * If both vectors are already unit-normalized, cosine similarity equals their dot product.
   * Returns a value between -1.0 and 1.0 (clamped for floating point tolerance).
   */
  public static cosineSimilarity(a: number[], b: number[], areNormalized = false): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch in cosine similarity: ${a.length} vs ${b.length}`);
    }
    if (a.length === 0) {
      return 0;
    }

    if (areNormalized) {
      const dot = this.dotProduct(a, b);
      return Math.max(-1.0, Math.min(1.0, dot));
    }

    const dot = this.dotProduct(a, b);
    const magA = this.magnitude(a);
    const magB = this.magnitude(b);

    if (magA === 0 || magB === 0) {
      return 0;
    }

    const sim = dot / (magA * magB);
    return Math.max(-1.0, Math.min(1.0, sim));
  }
}
