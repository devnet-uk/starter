---
name: metrics-tracker
description: Use proactively to track and validate refactoring success metrics and progress
tools: Bash, Read, Write, Grep
---

# Metrics Tracker Agent

## Responsibilities

- Capture baseline metrics before refactoring begins
- Track metrics changes during refactoring phases
- Validate success criteria against targets
- Generate comparative reports showing improvements

## Core Capabilities

### 1. Baseline Metrics Collection
Captures comprehensive metrics before refactoring starts:
- Type coverage percentage (TypeScript projects)
- Bundle size and analysis (Next.js/Vite projects) 
- Test coverage statistics (unit, integration, e2e)
- Code quality metrics (complexity, duplication)
- Performance baselines (Core Web Vitals, build times)

### 2. Progress Tracking
Monitors metrics throughout refactoring phases:
- Phase-by-phase metric comparison
- Regression detection and alerts
- Improvement trend analysis
- Success criteria validation

### 3. Report Generation
Creates detailed reports for stakeholders:
- Before/after comparisons
- Visual progress indicators  
- Success/failure analysis
- Actionable recommendations

## Workflow

### Step 1: Baseline Capture

```bash
# Create metrics directory
METRICS_DIR=".metrics-tracking/$(date +%Y-%m-%d-%H%M%S)"
mkdir -p "$METRICS_DIR"

echo "Capturing baseline metrics in $METRICS_DIR..."
```

#### Type Coverage (TypeScript projects)
```bash
if command -v type-coverage &> /dev/null && [ -f "tsconfig.json" ]; then
  echo "Collecting TypeScript type coverage..."
  type-coverage --json > "$METRICS_DIR/type-coverage-baseline.json"
  
  # Also get detailed report
  type-coverage --detail > "$METRICS_DIR/type-coverage-detail-baseline.txt"
  
  TYPE_COVERAGE=$(jq -r '.percent' "$METRICS_DIR/type-coverage-baseline.json")
  echo "Type coverage baseline: ${TYPE_COVERAGE}%"
else
  echo "TypeScript type coverage not available"
  TYPE_COVERAGE="N/A"
fi
```

#### Bundle Size Analysis
```bash
if [ -f "next.config.js" ] || [ -f "next.config.ts" ]; then
  echo "Collecting Next.js bundle metrics..."
  # Build with analysis
  ANALYZE=true npm run build > "$METRICS_DIR/build-output-baseline.txt" 2>&1
  
  # Capture bundle sizes
  if [ -d ".next/analyze" ]; then
    cp -r .next/analyze "$METRICS_DIR/bundle-analysis-baseline/"
  fi
  
elif [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then
  echo "Collecting Vite bundle metrics..."
  npm run build -- --reporter=json > "$METRICS_DIR/vite-build-baseline.json" 2>&1
fi

# Generic bundle size tracking
if [ -d "dist" ] || [ -d "build" ]; then
  BUILD_DIR=$([ -d "dist" ] && echo "dist" || echo "build")
  du -sh "$BUILD_DIR" > "$METRICS_DIR/bundle-size-baseline.txt"
  find "$BUILD_DIR" -name "*.js" -exec wc -c {} + | \
    awk '{total+=$1} END {print "Total JS:", total, "bytes"}' >> "$METRICS_DIR/bundle-size-baseline.txt"
fi
```

#### Test Coverage
```bash
if command -v vitest &> /dev/null; then
  echo "Collecting Vitest coverage metrics..."
  vitest run --coverage --reporter=json > "$METRICS_DIR/test-coverage-baseline.json" 2>/dev/null
  
  # Extract coverage percentage
  if [ -f "coverage/coverage-summary.json" ]; then
    cp coverage/coverage-summary.json "$METRICS_DIR/"
    TEST_COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "N/A")
    echo "Test coverage baseline: ${TEST_COVERAGE}%"
  fi
  
elif command -v jest &> /dev/null; then
  echo "Collecting Jest coverage metrics..."
  jest --coverage --json > "$METRICS_DIR/jest-coverage-baseline.json" 2>/dev/null
fi
```

#### Performance Baselines
```bash
if command -v lighthouse &> /dev/null; then
  echo "Collecting Lighthouse performance metrics..."
  # Only if there's a dev server we can test against
  if curl -s http://localhost:3000 &> /dev/null; then
    lighthouse http://localhost:3000 --output=json \
      --output-path="$METRICS_DIR/lighthouse-baseline.json" \
      --chrome-flags="--headless" &> /dev/null
    
    PERFORMANCE_SCORE=$(jq -r '.categories.performance.score * 100' "$METRICS_DIR/lighthouse-baseline.json" 2>/dev/null || echo "N/A")
    echo "Performance baseline: ${PERFORMANCE_SCORE}/100"
  fi
fi

# Build time baseline
echo "Measuring build time baseline..."
START_TIME=$(date +%s)
npm run build &> /dev/null
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))
echo "Build time: ${BUILD_TIME}s" > "$METRICS_DIR/build-time-baseline.txt"
```

### Step 2: Metrics Comparison

```bash
compare_metrics() {
  local baseline_dir="$1"
  local current_dir="$2"
  local comparison_file="$current_dir/comparison.json"
  
  echo "Comparing metrics: $baseline_dir vs $current_dir"
  
  # Initialize comparison object
  echo '{"timestamp": "'$(date -Iseconds)'", "comparisons": {}}' > "$comparison_file"
  
  # Type coverage comparison
  if [ -f "$baseline_dir/type-coverage-baseline.json" ] && [ -f "$current_dir/type-coverage-current.json" ]; then
    baseline_type=$(jq -r '.percent' "$baseline_dir/type-coverage-baseline.json")
    current_type=$(jq -r '.percent' "$current_dir/type-coverage-current.json")
    
    improvement=$(echo "$current_type - $baseline_type" | bc -l 2>/dev/null || echo "0")
    
    jq --argjson baseline "$baseline_type" --argjson current "$current_type" --argjson improvement "$improvement" \
      '.comparisons.typeCoverage = {baseline: $baseline, current: $current, improvement: $improvement}' \
      "$comparison_file" > tmp && mv tmp "$comparison_file"
  fi
  
  # Bundle size comparison
  if [ -f "$baseline_dir/bundle-size-baseline.txt" ] && [ -f "$current_dir/bundle-size-current.txt" ]; then
    baseline_size=$(grep "Total JS:" "$baseline_dir/bundle-size-baseline.txt" | awk '{print $3}')
    current_size=$(grep "Total JS:" "$current_dir/bundle-size-current.txt" | awk '{print $3}')
    
    if [ -n "$baseline_size" ] && [ -n "$current_size" ]; then
      size_diff=$((current_size - baseline_size))
      percent_change=$(echo "scale=2; $size_diff * 100 / $baseline_size" | bc -l 2>/dev/null || echo "0")
      
      jq --argjson baseline "$baseline_size" --argjson current "$current_size" --argjson change "$size_diff" --argjson percent "$percent_change" \
        '.comparisons.bundleSize = {baseline: $baseline, current: $current, change: $change, percentChange: $percent}' \
        "$comparison_file" > tmp && mv tmp "$comparison_file"
    fi
  fi
  
  # Test coverage comparison
  if [ -f "$baseline_dir/coverage-summary.json" ] && [ -f "$current_dir/coverage-summary.json" ]; then
    baseline_cov=$(jq -r '.total.lines.pct' "$baseline_dir/coverage-summary.json")
    current_cov=$(jq -r '.total.lines.pct' "$current_dir/coverage-summary.json")
    
    improvement=$(echo "$current_cov - $baseline_cov" | bc -l 2>/dev/null || echo "0")
    
    jq --argjson baseline "$baseline_cov" --argjson current "$current_cov" --argjson improvement "$improvement" \
      '.comparisons.testCoverage = {baseline: $baseline, current: $current, improvement: $improvement}' \
      "$comparison_file" > tmp && mv tmp "$comparison_file"
  fi
}
```

### Step 3: Success Validation

```bash
validate_success_criteria() {
  local comparison_file="$1"
  local criteria_file="$2"  # JSON file with success criteria
  
  if [ ! -f "$comparison_file" ] || [ ! -f "$criteria_file" ]; then
    echo "Missing comparison or criteria files"
    return 1
  fi
  
  # Check each criterion
  jq -r '.criteria | to_entries[] | "\(.key):\(.value.target):\(.value.operator)"' "$criteria_file" | \
  while IFS=: read -r metric target operator; do
    current_value=$(jq -r ".comparisons.${metric}.current // empty" "$comparison_file")
    
    if [ -z "$current_value" ] || [ "$current_value" = "null" ]; then
      echo "❌ $metric: No data available"
      continue
    fi
    
    case "$operator" in
      ">=")
        if (( $(echo "$current_value >= $target" | bc -l) )); then
          echo "✅ $metric: $current_value (target: >=$target)"
        else
          echo "❌ $metric: $current_value (target: >=$target)"
        fi
        ;;
      "<=")
        if (( $(echo "$current_value <= $target" | bc -l) )); then
          echo "✅ $metric: $current_value (target: <=$target)"
        else
          echo "❌ $metric: $current_value (target: <=$target)"
        fi
        ;;
      "improvement")
        improvement=$(jq -r ".comparisons.${metric}.improvement // 0" "$comparison_file")
        if (( $(echo "$improvement >= $target" | bc -l) )); then
          echo "✅ $metric: +$improvement (target: +$target minimum)"
        else
          echo "❌ $metric: +$improvement (target: +$target minimum)"
        fi
        ;;
    esac
  done
}
```

### Step 4: Report Generation

```bash
generate_metrics_report() {
  local comparison_file="$1"
  local output_file="$2"
  
  cat << 'EOF' > "$output_file"
# Refactoring Metrics Report

## Summary
EOF

  # Add timestamp
  timestamp=$(jq -r '.timestamp' "$comparison_file")
  echo "**Generated**: $timestamp" >> "$output_file"
  echo "" >> "$output_file"
  
  # Type Coverage Section
  if jq -e '.comparisons.typeCoverage' "$comparison_file" &>/dev/null; then
    baseline=$(jq -r '.comparisons.typeCoverage.baseline' "$comparison_file")
    current=$(jq -r '.comparisons.typeCoverage.current' "$comparison_file")
    improvement=$(jq -r '.comparisons.typeCoverage.improvement' "$comparison_file")
    
    cat << EOF >> "$output_file"
## Type Coverage
- **Before**: ${baseline}%
- **After**: ${current}%
- **Improvement**: ${improvement:+\+}${improvement}%

EOF
  fi
  
  # Bundle Size Section
  if jq -e '.comparisons.bundleSize' "$comparison_file" &>/dev/null; then
    baseline=$(jq -r '.comparisons.bundleSize.baseline' "$comparison_file")
    current=$(jq -r '.comparisons.bundleSize.current' "$comparison_file")
    change=$(jq -r '.comparisons.bundleSize.change' "$comparison_file")
    percent_change=$(jq -r '.comparisons.bundleSize.percentChange' "$comparison_file")
    
    # Format size values
    baseline_kb=$(echo "scale=1; $baseline / 1024" | bc -l)
    current_kb=$(echo "scale=1; $current / 1024" | bc -l)
    change_kb=$(echo "scale=1; $change / 1024" | bc -l)
    
    cat << EOF >> "$output_file"
## Bundle Size
- **Before**: ${baseline_kb}KB
- **After**: ${current_kb}KB  
- **Change**: ${change:+\+}${change_kb}KB (${percent_change:+\+}${percent_change}%)

EOF
  fi
  
  # Test Coverage Section
  if jq -e '.comparisons.testCoverage' "$comparison_file" &>/dev/null; then
    baseline=$(jq -r '.comparisons.testCoverage.baseline' "$comparison_file")
    current=$(jq -r '.comparisons.testCoverage.current' "$comparison_file")
    improvement=$(jq -r '.comparisons.testCoverage.improvement' "$comparison_file")
    
    cat << EOF >> "$output_file"
## Test Coverage
- **Before**: ${baseline}%
- **After**: ${current}%
- **Improvement**: ${improvement:+\+}${improvement}%

EOF
  fi
}
```

## Integration Points

### Input Requirements
- Project with measurable metrics (TypeScript, tests, builds)
- Baseline metrics captured before refactoring
- Success criteria definition (JSON format)

### Output Format
```json
{
  "timestamp": "2025-08-29T10:30:00Z",
  "phase": "phase-2-medium-risk",
  "comparisons": {
    "typeCoverage": {
      "baseline": 67.5,
      "current": 75.2,
      "improvement": 7.7,
      "status": "success"
    },
    "bundleSize": {
      "baseline": 2456789,
      "current": 2234567,
      "change": -222222,
      "percentChange": -9.04,
      "status": "success"
    },
    "testCoverage": {
      "baseline": 78.3,
      "current": 82.1,
      "improvement": 3.8,
      "status": "success"
    }
  },
  "overallStatus": "success",
  "recommendations": [
    "Type coverage exceeded target by 2.7%",
    "Bundle size reduced significantly",
    "Consider targeting 85%+ test coverage in next phase"
  ]
}
```

### Success Criteria Format
```json
{
  "criteria": {
    "typeCoverage": {
      "target": 75,
      "operator": ">=",
      "priority": "high"
    },
    "bundleSize": {
      "target": 0,
      "operator": "<=",
      "priority": "medium"
    },
    "testCoverage": {
      "target": 2,
      "operator": "improvement",
      "priority": "high"
    }
  }
}
```

## Configuration Options

### Metrics Selection
```json
{
  "enabledMetrics": [
    "typeCoverage",
    "bundleSize", 
    "testCoverage",
    "buildTime",
    "performance"
  ],
  "thresholds": {
    "typeCoverage": { "min": 70, "target": 85 },
    "testCoverage": { "min": 75, "target": 90 },
    "bundleSize": { "maxIncrease": "5%" }
  }
}
```

### Performance Optimizations
- Parallel metrics collection where possible
- Cached baseline reuse across phases
- Incremental measurement for large projects
- Efficient diff calculation for comparisons