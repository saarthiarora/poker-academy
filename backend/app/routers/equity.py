from fastapi import APIRouter, HTTPException
from app.models.schemas import EquitySimulationRequest
from app.engine.equity_calculator import run_equity_simulation

router = APIRouter(prefix="/api/equity", tags=["equity"])

@router.post("/calculate")
def calculate_equity(req: EquitySimulationRequest):
    if len(req.players) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least 2 players")
    
    # Cap simulations at 100,000
    sims = min(max(req.num_simulations, 100), 100000)

    try:
        result = run_equity_simulation(
            players_hands=req.players,
            board_cards=req.board,
            num_simulations=sims
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

