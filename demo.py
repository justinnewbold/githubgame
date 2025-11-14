#!/usr/bin/env python3
"""
Demo script for Quantum Garden - simulates a quick playthrough
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from quantum_garden import QuantumGarden

def print_separator():
    print("\n" + "="*50 + "\n")

def demo():
    """Run a demo of the Quantum Garden."""
    print("\n🌌 QUANTUM GARDEN DEMO 🌌\n")
    print("Demonstrating a unique video game experience...\n")
    time.sleep(1)
    
    # Initialize garden
    print("Initializing quantum garden with superposed states...")
    garden = QuantumGarden()
    garden.initialize_garden()
    print(f"✓ Created {len(garden.states)} quantum states")
    time.sleep(1)
    
    print_separator()
    
    # Show initial states
    print("VIEWING INITIAL QUANTUM STATES:")
    print("(Each state contains the same seed in different realities)")
    for i in range(len(garden.states)):
        print(garden.render_state(i))
    time.sleep(2)
    
    print_separator()
    
    # Plant some seeds
    print("PLANTING SEEDS across quantum states...")
    garden.plant_seed(5, 10)
    garden.plant_seed(15, 10)
    garden.plant_seed(10, 5)
    print("✓ Seeds planted at (5,10), (15,10), and (10,5)")
    print("Each seed exists differently in each quantum state!")
    time.sleep(1)
    
    print_separator()
    
    # Evolve the garden
    print("LETTING TIME FLOW...")
    print("Evolving garden for 10 quantum hours...")
    garden.evolve_all_states(10.0)
    print("✓ Garden evolved!")
    time.sleep(1)
    
    print_separator()
    
    # Show evolved states
    print("VIEWING EVOLVED QUANTUM STATES:")
    print("(Notice how plants have spread differently in each reality)")
    for i in range(len(garden.states)):
        print(garden.render_state(i))
    time.sleep(2)
    
    print_separator()
    
    # Show statistics
    print("GARDEN STATISTICS:")
    print(garden.get_stats())
    time.sleep(1)
    
    print_separator()
    
    # Collapse to a state
    print("COLLAPSING QUANTUM WAVEFUNCTION...")
    print("Choosing to observe state 1...")
    print("⚠️  This will destroy all other quantum realities!")
    time.sleep(1)
    garden.collapse_state(1)
    print("✓ Reality collapsed!")
    print(f"Only {len(garden.states)} state remains")
    time.sleep(1)
    
    print_separator()
    
    # Show collapsed state
    print("VIEWING COLLAPSED REALITY:")
    print(garden.render_state(0))
    time.sleep(1)
    
    print_separator()
    
    # Create superposition again
    print("CREATING NEW SUPERPOSITION...")
    print("Splitting reality into parallel universes...")
    garden.create_superposition()
    print(f"✓ Reality split into {len(garden.states)} new states!")
    time.sleep(1)
    
    print_separator()
    
    # Evolve again
    print("EVOLVING NEW QUANTUM STATES...")
    garden.evolve_all_states(5.0)
    print("✓ Each parallel universe has evolved independently")
    time.sleep(1)
    
    print_separator()
    
    # Show final states
    print("FINAL QUANTUM STATES:")
    for i in range(len(garden.states)):
        print(garden.render_state(i))
    time.sleep(1)
    
    print_separator()
    
    # Final statistics
    print("FINAL STATISTICS:")
    print(garden.get_stats())
    
    print_separator()
    
    print("🌱 DEMO COMPLETE 🌱\n")
    print("This demonstrates the unique mechanics of Quantum Garden:")
    print("  ✓ Quantum superposition of game states")
    print("  ✓ Observer effect (collapsing states)")
    print("  ✓ Reality splitting (creating superpositions)")
    print("  ✓ Temporal evolution across all states")
    print("  ✓ Procedural ASCII art generation")
    print("  ✓ Unique gameplay unlike any other game")
    print("\nTo play interactively, run: python3 quantum_garden.py")
    print()

if __name__ == "__main__":
    demo()
