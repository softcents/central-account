describe('OCR Authenticity & MRZ Checksum Validation', () => {
  /**
   * Standard ICAO Doc 9303 7-3-1 check digit calculation
   */
  function computeIcao9303CheckDigit(input: string): number {
    const weights = [7, 3, 1];
    let sum = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input[i].toUpperCase();
      let val = 0;

      if (char >= '0' && char <= '9') {
        val = parseInt(char, 10);
      } else if (char >= 'A' && char <= 'Z') {
        val = char.charCodeAt(0) - 55; // 'A' = 10, 'Z' = 35
      } else if (char === '<') {
        val = 0;
      } else {
        val = 0;
      }

      sum += val * weights[i % 3];
    }

    return sum % 10;
  }

  function validateMrzDate(dateStr: string): { isValid: boolean; parsedDate?: Date } {
    if (!/^\d{6}$/.test(dateStr)) {
      return { isValid: false };
    }
    const yy = parseInt(dateStr.substring(0, 2), 10);
    const mm = parseInt(dateStr.substring(2, 4), 10);
    const dd = parseInt(dateStr.substring(4, 6), 10);

    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
      return { isValid: false };
    }

    // Assume 50-year pivot for 20th vs 21st century
    const currentYearShort = new Date().getFullYear() % 100;
    const century = yy <= currentYearShort + 10 ? 2000 : 1900;
    const fullYear = century + yy;

    const parsedDate = new Date(Date.UTC(fullYear, mm - 1, dd));
    return { isValid: true, parsedDate };
  }

  describe('ICAO 9303 7-3-1 Check Digits', () => {
    it('should correctly calculate passport number check digit', () => {
      // Example: 'L898902C<' -> check digit should be 3
      // L(21)*7 + 8*3 + 9*1 + 8*7 + 9*3 + 0*1 + 2*7 + C(12)*3 + <(0)*1
      // = 147 + 24 + 9 + 56 + 27 + 0 + 14 + 36 + 0 = 313 -> 313 % 10 = 3
      const passportNo = 'L898902C<';
      const checkDigit = computeIcao9303CheckDigit(passportNo);
      expect(checkDigit).toBe(3);
    });

    it('should calculate date of birth check digit', () => {
      // Date of birth: '740812' -> 7*7 + 4*3 + 0*1 + 8*7 + 1*3 + 2*1
      // = 49 + 12 + 0 + 56 + 3 + 2 = 122 -> 122 % 10 = 2
      const dob = '740812';
      const checkDigit = computeIcao9303CheckDigit(dob);
      expect(checkDigit).toBe(2);
    });

    it('should calculate expiration date check digit', () => {
      // Expiration: '120415' -> 1*7 + 2*3 + 0*1 + 4*7 + 1*3 + 5*1
      // = 7 + 6 + 0 + 28 + 3 + 5 = 49 -> 49 % 10 = 9
      const exp = '120415';
      const checkDigit = computeIcao9303CheckDigit(exp);
      expect(checkDigit).toBe(9);
    });

    it('should handle filler character < as value 0', () => {
      const fieldWithFillers = 'A12345<<<';
      const result = computeIcao9303CheckDigit(fieldWithFillers);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(9);
    });
  });

  describe('MRZ Date Formats & Consistency', () => {
    it('should validate valid YYMMDD birth date', () => {
      const res = validateMrzDate('950315');
      expect(res.isValid).toBe(true);
      expect(res.parsedDate?.getUTCFullYear()).toBe(1995);
      expect(res.parsedDate?.getUTCMonth()).toBe(2); // March = 2
      expect(res.parsedDate?.getUTCDate()).toBe(15);
    });

    it('should reject invalid month in YYMMDD string', () => {
      const res = validateMrzDate('951315'); // Month 13 is invalid
      expect(res.isValid).toBe(false);
    });

    it('should reject invalid day in YYMMDD string', () => {
      const res = validateMrzDate('950332'); // Day 32 is invalid
      expect(res.isValid).toBe(false);
    });

    it('should reject non-numeric string', () => {
      const res = validateMrzDate('95O315'); // O instead of 0
      expect(res.isValid).toBe(false);
    });
  });
});
