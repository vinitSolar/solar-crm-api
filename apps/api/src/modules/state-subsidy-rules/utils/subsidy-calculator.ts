/**
 * Unified Solar Subsidy Calculation Engine
 * Supports:
 * 1. PM Surya Ghar Central Subsidy (Tiered Capacity Slabs)
 * 2. Gujarat State Top-Up Subsidy (Surya Gujarat / GUVNL Benchmark Cost + Co-Pay Model)
 * 3. Generic Capacity Slabs and Flat Rates
 */

export type SubsidyCalculationType = "CAPACITY_SLABS" | "BENCHMARK_TOPUP" | "FLAT_PER_KW";

export interface ICapacitySlab {
    fromKw: number;
    toKw: number;
    ratePerKw: number;
}

export interface IBenchmarkSlab {
    fromKw: number;
    toKw: number;
    benchmarkRatePerKw: number;
}

export interface ICoPayRate {
    categories: number[]; // 1: General/Open, 2: EWS, 3: OBC, 4: SC/ST
    coPayPercentage: number; // e.g. 10 for 10%, 5 for 5%
}

export interface ISubsidyCalculationConfig {
    calculationType?: SubsidyCalculationType;
    
    // For CAPACITY_SLABS
    capacitySlabs?: ICapacitySlab[];
    maximumSubsidyAmount?: number;

    // For BENCHMARK_TOPUP (e.g. Gujarat State Scheme)
    baseScheme?: string;
    maxEligibleKw?: number; // e.g. 2.18
    benchmarkSlabs?: IBenchmarkSlab[];
    deductCentralSubsidy?: boolean;
    coPayRates?: ICoPayRate[];

    // For FLAT_PER_KW
    subsidyPerKw?: number;
}

/**
 * Computes the total benchmark cost for a given system size from benchmark slabs
 */
export function computeBenchmarkCostFromSlabs(
    systemSizeKw: number,
    slabs: Array<{ fromKw: number; toKw: number; benchmarkRatePerKw: number }>
): number {
    const kw = Math.max(0, Number(systemSizeKw) || 0);
    if (kw <= 0 || !Array.isArray(slabs) || slabs.length === 0) return 0;

    let total = 0;
    for (const slab of slabs) {
        const from = Math.max(0, Number(slab.fromKw) || 0);
        const to = Math.max(from, Number(slab.toKw) || 0);
        const rate = Math.max(0, Number(slab.benchmarkRatePerKw) || 0);
        if (from >= to || kw <= from) continue;

        const slabCapacity = Math.min(kw, to) - from;
        total += slabCapacity * rate;
    }

    return Math.round(total);
}

export interface ISubsidyItemResult {
    uid?: string | undefined;
    name: string;
    schemeType: "CENTRAL" | "STATE";
    amount: number;
    benchmarkCost?: number | undefined;
    beneficiaryShare?: number | undefined;
    description?: string | undefined;
    isEligible?: boolean | undefined;
}

export interface ITotalSubsidyCalculationResult {
    centralSubsidy: number;
    stateSubsidy: number;
    totalSubsidy: number;
    items: ISubsidyItemResult[];
    netCustomerCost?: number | undefined;
}

/**
 * Standard Central PM Surya Ghar CFA Calculation:
 * - 1st to 2nd kW: Rs 30,000 / kW (prorated for fractions)
 * - 3rd kW (2.001 to 3.0 kW): Rs 18,000 / kW
 * - Above 3.0 kW: Capped at Rs 78,000
 */
export function calculateCentralSuryaGharSubsidy(systemSizeKw: number): number {
    const kw = Math.max(0, Number(systemSizeKw) || 0);
    if (kw <= 0) return 0;

    let total = 0;
    if (kw <= 2) {
        total = kw * 30000;
    } else if (kw < 3) {
        total = (2 * 30000) + ((kw - 2) * 18000);
    } else {
        total = 78000;
    }

    return Math.min(78000, Math.round(total));
}

/**
 * Gujarat State Top-Up Subsidy Calculation:
 * - Max eligible system size: 2.18 kWp (systems above 2.18 kW get Rs 0 state subsidy)
 * - Benchmark cost:
 *     - First 2 kW: Rs 50,000 / kW
 *     - 2 to 2.18 kW: Rs 45,000 / kW
 * - Beneficiary co-pay:
 *     - SC / ST (Category 4): 5% of benchmark cost
 *     - General / OBC / EWS (Category 1, 2, 3 or default): 10% of benchmark cost
 * - State Subsidy = Benchmark Cost - Central CFA - Beneficiary Co-Pay
 */
export function calculateGujaratStateSubsidy(
    systemSizeKw: number,
    category: number = 1,
    centralSubsidyAmount?: number
): {
    stateSubsidy: number;
    benchmarkCost: number;
    beneficiaryShare: number;
    isEligible: boolean;
    reason?: string;
} {
    const kw = Math.max(0, Number(systemSizeKw) || 0);
    if (kw <= 0) {
        return { stateSubsidy: 0, benchmarkCost: 0, beneficiaryShare: 0, isEligible: true };
    }

    // Cutoff check: Only up to 2.18 kW qualifies for Gujarat state top-up
    if (kw > 2.18001) {
        return {
            stateSubsidy: 0,
            benchmarkCost: 0,
            beneficiaryShare: 0,
            isEligible: false,
            reason: "System size exceeds 2.18 kW Gujarat state top-up limit"
        };
    }

    // 1. Calculate Benchmark Cost
    let benchmarkCost = 0;
    if (kw <= 2) {
        benchmarkCost = kw * 50000;
    } else {
        benchmarkCost = (2 * 50000) + ((kw - 2) * 45000);
    }
    benchmarkCost = Math.round(benchmarkCost);

    // 2. Central Subsidy deduction
    const centralSubsidy = centralSubsidyAmount !== undefined
        ? centralSubsidyAmount
        : calculateCentralSuryaGharSubsidy(kw);

    // 3. Beneficiary co-pay: 5% for SC/ST (Category 4), 10% for General / EWS / OBC
    const coPayPercent = Number(category) === 4 ? 0.05 : 0.10;
    const beneficiaryShare = Math.round(benchmarkCost * coPayPercent);

    // 4. Gujarat State Subsidy
    const stateSubsidy = Math.max(0, benchmarkCost - centralSubsidy - beneficiaryShare);

    return {
        stateSubsidy,
        benchmarkCost,
        beneficiaryShare,
        isEligible: true
    };
}

/**
 * Calculates subsidy dynamically for any arbitrary rule configuration
 */
export function calculateDynamicRuleSubsidy(
    rule: {
        calculation_type?: string | null | undefined;
        calculationType?: string | null | undefined;
        calculation_config?: ISubsidyCalculationConfig | string | null | undefined;
        calculationConfig?: ISubsidyCalculationConfig | string | null | undefined;
        subsidy_per_kw?: number | null | undefined;
        subsidyPerKw?: number | null | undefined;
        maximum_subsidy_amount?: number | null | undefined;
        maximumSubsidyAmount?: number | null | undefined;
        category_rates?: any;
        categoryRates?: any;
        categories?: number[] | undefined;
        scheme_name?: string | null | undefined;
        schemeName?: string | null | undefined;
        state_uid?: string | null | undefined;
        stateUid?: string | null | undefined;
        state_name?: string | null | undefined;
        stateName?: string | null | undefined;
        uid?: string | undefined;
    },
    systemSizeKw: number,
    category: number = 1,
    centralSubsidyAmount?: number
): {
    amount: number;
    benchmarkCost?: number | undefined;
    beneficiaryShare?: number | undefined;
    isEligible?: boolean | undefined;
    description?: string | undefined;
} {
    const kw = Math.max(0, Number(systemSizeKw) || 0);
    if (kw <= 0) return { amount: 0, isEligible: true };

    const rawConfig = rule.calculation_config ?? rule.calculationConfig;
    let config: ISubsidyCalculationConfig = {};
    if (rawConfig) {
        config = typeof rawConfig === "string"
            ? JSON.parse(rawConfig)
            : rawConfig;
    }

    const calcType = (rule.calculation_type || rule.calculationType || config.calculationType || "").toUpperCase();
    const schemeName = (rule.scheme_name || rule.schemeName || "").toLowerCase();
    const stateUid = rule.state_uid ?? rule.stateUid;
    const isCentralScheme = !stateUid || stateUid === "All" || (schemeName.includes("surya") && schemeName.includes("ghar"));
    const stateName = (rule.state_name || rule.stateName || "").toLowerCase();
    const isGujaratState = stateName.includes("gujarat") || schemeName.includes("gujarat");

    // 1. BENCHMARK_TOPUP (like Gujarat)
    if (calcType === "BENCHMARK_TOPUP" || isGujaratState && (calcType === "" || schemeName.includes("top-up") || schemeName.includes("surya gujarat"))) {
        const maxKw = Number(config.maxEligibleKw) || 2.18;
        if (kw > maxKw + 0.0001) {
            return {
                amount: 0,
                isEligible: false,
                description: `System size (${kw} kW) exceeds maximum state limit (${maxKw} kW)`
            };
        }

        const benchmarkSlabs = config.benchmarkSlabs && config.benchmarkSlabs.length > 0
            ? config.benchmarkSlabs
            : [
                { fromKw: 0, toKw: 2, benchmarkRatePerKw: 50000 },
                { fromKw: 2, toKw: 2.18, benchmarkRatePerKw: 45000 }
            ];

        const benchmarkCost = computeBenchmarkCostFromSlabs(kw, benchmarkSlabs);

        // Co-pay calculation
        let coPayPercent = 10;
        if (config.coPayRates && config.coPayRates.length > 0) {
            const matchedRate = config.coPayRates.find(r => r.categories.includes(Number(category)));
            if (matchedRate) {
                coPayPercent = matchedRate.coPayPercentage;
            } else if (Number(category) === 4) {
                coPayPercent = 5;
            }
        } else if (Number(category) === 4) {
            coPayPercent = 5;
        }

        const beneficiaryShare = Math.round(benchmarkCost * (coPayPercent / 100));
        const centralDeduction = config.deductCentralSubsidy !== false
            ? (centralSubsidyAmount !== undefined ? centralSubsidyAmount : calculateCentralSuryaGharSubsidy(kw))
            : 0;

        const stateSubsidy = Math.max(0, benchmarkCost - centralDeduction - beneficiaryShare);

        return {
            amount: stateSubsidy,
            benchmarkCost,
            beneficiaryShare,
            isEligible: true,
            description: `Benchmark ₹${benchmarkCost.toLocaleString("en-IN")} - Central ₹${centralDeduction.toLocaleString("en-IN")} - ${coPayPercent}% Co-Pay (₹${beneficiaryShare.toLocaleString("en-IN")})`
        };
    }

    // 2. CAPACITY_SLABS (like PM Surya Ghar Central)
    if (calcType === "CAPACITY_SLABS" || isCentralScheme) {
        const capacitySlabs = config.capacitySlabs && config.capacitySlabs.length > 0
            ? config.capacitySlabs
            : [
                { fromKw: 0, toKw: 2, ratePerKw: 30000 },
                { fromKw: 2, toKw: 3, ratePerKw: 18000 }
            ];
        const maxCap = Number(config.maximumSubsidyAmount || rule.maximum_subsidy_amount) || 78000;

        let totalAmount = 0;
        let remainingKw = kw;

        for (const slab of capacitySlabs) {
            if (remainingKw <= 0) break;
            const slabSpan = slab.toKw - slab.fromKw;
            const slabUsed = Math.max(0, Math.min(slabSpan, remainingKw));
            totalAmount += slabUsed * slab.ratePerKw;
            remainingKw -= slabUsed;
        }

        const cappedAmount = Math.min(maxCap, Math.round(totalAmount));
        const res: {
            amount: number;
            benchmarkCost?: number | undefined;
            beneficiaryShare?: number | undefined;
            isEligible?: boolean | undefined;
            description?: string | undefined;
        } = {
            amount: cappedAmount,
            isEligible: true
        };
        if (kw >= 3) {
            res.description = `Capped at maximum of ₹${maxCap.toLocaleString("en-IN")}`;
        }
        return res;
    }

    // 3. FLAT_PER_KW / Standard Fallback
    const ratePerKw = Number(config.subsidyPerKw ?? rule.subsidy_per_kw) || 0;
    const maxAmount = Number(config.maximumSubsidyAmount ?? rule.maximum_subsidy_amount);
    const calculated = kw * ratePerKw;
    const capped = Number.isFinite(maxAmount) && maxAmount > 0 ? Math.min(calculated, maxAmount) : calculated;

    return {
        amount: Math.round(capped),
        isEligible: true
    };
}
