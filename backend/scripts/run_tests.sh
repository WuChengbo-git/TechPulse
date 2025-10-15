#!/bin/bash
# TechPulse Backend Test Runner Script

set -e  # Exit on error

echo "================================"
echo "  TechPulse Backend Test Suite"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}Error: pytest is not installed${NC}"
    echo "Install with: pip install -r requirements-test.txt"
    exit 1
fi

# Parse command line arguments
TEST_TYPE="${1:-all}"
COVERAGE="${2:-yes}"

echo "Test Type: $TEST_TYPE"
echo "Coverage: $COVERAGE"
echo ""

# Base pytest command
PYTEST_CMD="pytest"

# Add coverage if enabled
if [ "$COVERAGE" == "yes" ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=app --cov-report=html --cov-report=term-missing"
fi

# Run tests based on type
case $TEST_TYPE in
    "all")
        echo -e "${GREEN}Running all tests...${NC}"
        $PYTEST_CMD tests/
        ;;
    "unit")
        echo -e "${GREEN}Running unit tests...${NC}"
        $PYTEST_CMD tests/unit/ -m unit
        ;;
    "integration")
        echo -e "${GREEN}Running integration tests...${NC}"
        $PYTEST_CMD tests/integration/ -m integration
        ;;
    "auth")
        echo -e "${GREEN}Running auth tests...${NC}"
        $PYTEST_CMD -m auth
        ;;
    "fast")
        echo -e "${GREEN}Running fast tests (unit only)...${NC}"
        $PYTEST_CMD tests/unit/ -m "unit and not slow"
        ;;
    "watch")
        echo -e "${YELLOW}Watching for changes...${NC}"
        pytest-watch tests/
        ;;
    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo "Usage: $0 [all|unit|integration|auth|fast|watch] [yes|no]"
        exit 1
        ;;
esac

# Check test results
TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    if [ "$COVERAGE" == "yes" ]; then
        echo -e "${GREEN}📊 Coverage report: htmlcov/index.html${NC}"
    fi
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit $TEST_EXIT_CODE
fi
