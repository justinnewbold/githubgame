#!/usr/bin/env python3
"""Test script for Quantum Garden game."""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from quantum_garden import QuantumGarden, QuantumState, Game

def test_quantum_state():
    """Test QuantumState creation and methods."""
    print("Testing QuantumState...")
    
    state = QuantumState("test_state", 0.5)
    assert state.state_id == "test_state"
    assert state.probability == 0.5
    assert len(state.plants) == 0
    
    # Test adding plant
    state.add_plant(5, 5, '🌱')
    assert (5, 5) in state.plants
    assert state.plants[(5, 5)] == '🌱'
    
    # Test evolution
    initial_age = state.age
    state.evolve(1.0)
    assert state.age == initial_age + 1.0
    
    # Test serialization
    data = state.to_dict()
    assert 'state_id' in data
    assert 'probability' in data
    
    # Test deserialization
    state2 = QuantumState.from_dict(data)
    assert state2.state_id == state.state_id
    assert state2.probability == state.probability
    
    print("✓ QuantumState tests passed")

def test_quantum_garden():
    """Test QuantumGarden creation and methods."""
    print("Testing QuantumGarden...")
    
    garden = QuantumGarden()
    garden.initialize_garden()
    
    # Test initialization
    assert len(garden.states) == 3
    assert all(state.probability == 1.0/3.0 for state in garden.states)
    
    # Test that each state has the initial plant
    for state in garden.states:
        assert (10, 10) in state.plants
    
    # Test planting seed
    garden.plant_seed(5, 5)
    for state in garden.states:
        assert (5, 5) in state.plants
    
    # Test state collapse
    initial_count = len(garden.states)
    garden.collapse_state(0)
    assert len(garden.states) == 1
    assert garden.states[0].probability == 1.0
    assert garden.total_observations == 1
    
    # Test superposition creation
    garden.create_superposition()
    assert len(garden.states) == 3
    assert garden.reality_splits == 1
    
    # Test evolution
    garden.evolve_all_states(2.0)
    for state in garden.states:
        assert state.age >= 2.0
    
    # Test rendering
    render = garden.render_state(0)
    assert "Quantum State" in render
    assert "Probability" in render
    
    # Test stats
    stats = garden.get_stats()
    assert "QUANTUM GARDEN STATISTICS" in stats
    assert "Active Quantum States" in stats
    
    print("✓ QuantumGarden tests passed")

def test_save_load():
    """Test save and load functionality."""
    print("Testing save/load...")
    
    # Create a garden
    garden1 = QuantumGarden()
    garden1.initialize_garden()
    garden1.plant_seed(7, 7)
    garden1.total_observations = 5
    garden1.reality_splits = 3
    
    # Save it
    test_file = "/tmp/test_quantum_garden.json"
    garden1.save(test_file)
    assert os.path.exists(test_file)
    
    # Load it
    garden2 = QuantumGarden.load(test_file)
    assert garden2 is not None
    assert len(garden2.states) == len(garden1.states)
    assert garden2.total_observations == garden1.total_observations
    assert garden2.reality_splits == garden1.reality_splits
    
    # Verify plants are preserved
    for s1, s2 in zip(garden1.states, garden2.states):
        assert len(s1.plants) == len(s2.plants)
    
    # Clean up
    os.remove(test_file)
    
    print("✓ Save/load tests passed")

def test_plant_mutations():
    """Test that plant mutations work."""
    print("Testing plant mutations...")
    
    state = QuantumState("test", 1.0)
    
    # Test various mutations
    plants = ['🌱', '🌿', '🌾', '🍀', '🌳']
    for plant in plants:
        mutated = state.mutate_plant(plant)
        # Mutation should return a valid plant (either same or mutated)
        assert mutated is not None
        assert isinstance(mutated, str)
    
    print("✓ Plant mutation tests passed")

def test_game_mechanics():
    """Test complete game flow."""
    print("Testing complete game mechanics...")
    
    garden = QuantumGarden()
    garden.initialize_garden()
    
    # Verify initial state
    assert len(garden.states) == 3
    
    # Plant seeds
    garden.plant_seed(3, 3)
    garden.plant_seed(15, 15)
    
    # Evolve
    garden.evolve_all_states(5.0)
    
    # Check that plants might have spread
    total_plants = sum(len(state.plants) for state in garden.states)
    assert total_plants >= 3  # At least the original plants
    
    # Collapse state
    garden.collapse_state(1)
    assert len(garden.states) == 1
    
    # Create superposition again
    garden.create_superposition()
    assert len(garden.states) == 3
    
    # Each state should have the same initial plants
    plant_count = len(garden.states[0].plants)
    assert plant_count > 0
    
    print("✓ Game mechanics tests passed")

def run_all_tests():
    """Run all tests."""
    print("\n" + "="*50)
    print("QUANTUM GARDEN TEST SUITE")
    print("="*50 + "\n")
    
    try:
        test_quantum_state()
        test_quantum_garden()
        test_save_load()
        test_plant_mutations()
        test_game_mechanics()
        
        print("\n" + "="*50)
        print("ALL TESTS PASSED ✓")
        print("="*50 + "\n")
        return 0
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
