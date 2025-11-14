#!/usr/bin/env python3
"""
Quantum Garden - A Reality-Bending Game

A unique game where you tend a garden that exists in multiple quantum states.
Your observations collapse these states, revealing different realities.
The garden evolves even when you're not playing.
"""

import json
import os
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any


class QuantumState:
    """Represents a single quantum state of the garden."""
    
    def __init__(self, state_id: str, probability: float = 1.0):
        self.state_id = state_id
        self.probability = probability
        self.plants: Dict[Tuple[int, int], str] = {}
        self.age = 0.0  # Age in hours
        self.collapsed = False
        self.birth_time = datetime.now()
        
    def add_plant(self, x: int, y: int, plant_type: str):
        """Add a plant at a specific position."""
        self.plants[(x, y)] = plant_type
        
    def evolve(self, hours: float):
        """Evolve the state over time."""
        self.age += hours
        
        # Plants spread based on age and quantum probability
        if random.random() < self.probability * 0.3:
            if self.plants:
                # Pick a random plant to spread from
                pos, plant = random.choice(list(self.plants.items()))
                x, y = pos
                
                # Spread to adjacent position
                dx, dy = random.choice([(0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (-1, -1), (1, -1), (-1, 1)])
                new_x, new_y = x + dx, y + dy
                
                if 0 <= new_x < 20 and 0 <= new_y < 20:
                    if (new_x, new_y) not in self.plants:
                        self.plants[(new_x, new_y)] = self.mutate_plant(plant)
    
    def mutate_plant(self, plant: str) -> str:
        """Mutate a plant type based on quantum effects."""
        mutations = {
            '🌱': ['🌿', '🌾', '🍀'],
            '🌿': ['🌳', '🌲', '🎋'],
            '🌾': ['🌻', '🌺', '🌸'],
            '🍀': ['☘️', '🌱', '🌿'],
            '🌳': ['🎄', '🌲', '🌴'],
            '🌲': ['🌳', '🎄', '🌵'],
            '🌻': ['🌺', '🌸', '🌼'],
            '🌺': ['🌻', '🌸', '🌷'],
            '🌸': ['🌺', '🌻', '🌹'],
        }
        
        if plant in mutations and random.random() < 0.5:
            return random.choice(mutations[plant])
        return plant
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'state_id': self.state_id,
            'probability': self.probability,
            'plants': {f"{x},{y}": plant for (x, y), plant in self.plants.items()},
            'age': self.age,
            'collapsed': self.collapsed,
            'birth_time': self.birth_time.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'QuantumState':
        """Create from dictionary."""
        state = cls(data['state_id'], data['probability'])
        state.plants = {tuple(map(int, k.split(','))): v for k, v in data['plants'].items()}
        state.age = data['age']
        state.collapsed = data['collapsed']
        state.birth_time = datetime.fromisoformat(data['birth_time'])
        return state


class QuantumGarden:
    """The main quantum garden that manages multiple states."""
    
    def __init__(self):
        self.states: List[QuantumState] = []
        self.current_state_index = 0
        self.last_update = datetime.now()
        self.total_observations = 0
        self.reality_splits = 0
        
    def initialize_garden(self):
        """Initialize with a superposition of states."""
        # Create 3 initial quantum states
        for i in range(3):
            state = QuantumState(f"state_{i}", probability=1.0/3.0)
            # Add initial seed plant at center
            state.add_plant(10, 10, '🌱')
            self.states.append(state)
        
    def collapse_state(self, state_index: int):
        """Collapse to a single quantum state (observer effect)."""
        if 0 <= state_index < len(self.states):
            chosen_state = self.states[state_index]
            chosen_state.probability = 1.0
            chosen_state.collapsed = True
            
            # Remove other states
            self.states = [chosen_state]
            self.current_state_index = 0
            self.total_observations += 1
            
            return True
        return False
    
    def create_superposition(self):
        """Create new quantum states from current state (reality split)."""
        if len(self.states) == 1:
            base_state = self.states[0]
            self.states = []
            
            # Create 3 new superposed states
            for i in range(3):
                new_state = QuantumState(f"split_{self.reality_splits}_{i}", probability=1.0/3.0)
                new_state.plants = base_state.plants.copy()
                new_state.age = base_state.age
                self.states.append(new_state)
            
            self.reality_splits += 1
            return True
        return False
    
    def plant_seed(self, x: int, y: int):
        """Plant a seed in all quantum states."""
        plant_types = ['🌱', '🌿', '🌾', '🍀']
        
        for state in self.states:
            # Each state gets a potentially different plant type
            plant = random.choice(plant_types)
            if (x, y) not in state.plants:
                state.add_plant(x, y, plant)
    
    def evolve_all_states(self, hours: float):
        """Evolve all quantum states."""
        for state in self.states:
            state.evolve(hours)
    
    def update_time_evolution(self):
        """Update garden based on time passed since last update."""
        now = datetime.now()
        hours_passed = (now - self.last_update).total_seconds() / 3600.0
        
        if hours_passed > 0:
            self.evolve_all_states(hours_passed)
            self.last_update = now
    
    def render_state(self, state_index: int) -> str:
        """Render a specific quantum state as ASCII art."""
        if not (0 <= state_index < len(self.states)):
            return "Invalid state"
        
        state = self.states[state_index]
        grid = [[' ' for _ in range(20)] for _ in range(20)]
        
        # Place plants
        for (x, y), plant in state.plants.items():
            if 0 <= x < 20 and 0 <= y < 20:
                grid[y][x] = plant
        
        # Build the output
        lines = []
        lines.append(f"\n╔{'═' * 42}╗")
        lines.append(f"║  Quantum State: {state.state_id:<25} ║")
        prob_str = f"{state.probability:.1%}"
        lines.append(f"║  Probability: {prob_str:<27} ║")
        age_str = f"{state.age:.1f} hours"
        lines.append(f"║  Age: {age_str:<34} ║")
        lines.append(f"╠{'═' * 42}╣")
        
        for row in grid:
            line = '║ ' + ''.join(row) + ' ║'
            lines.append(line)
        
        lines.append(f"╚{'═' * 42}╝")
        return '\n'.join(lines)
    
    def get_stats(self) -> str:
        """Get garden statistics."""
        total_plants = sum(len(state.plants) for state in self.states)
        avg_age = sum(state.age for state in self.states) / len(self.states) if self.states else 0
        
        avg_age_str = f"{avg_age:.1f} hours"
        stats = f"""
╔═══════════════════════════════════════════╗
║         QUANTUM GARDEN STATISTICS         ║
╠═══════════════════════════════════════════╣
║  Active Quantum States: {len(self.states):<17} ║
║  Total Plants: {total_plants:<27} ║
║  Average Age: {avg_age_str:<29} ║
║  Total Observations: {self.total_observations:<19} ║
║  Reality Splits: {self.reality_splits:<23} ║
╚═══════════════════════════════════════════╝
"""
        return stats
    
    def save(self, filename: str = "quantum_garden_save.json"):
        """Save the garden state to a file."""
        data = {
            'states': [state.to_dict() for state in self.states],
            'current_state_index': self.current_state_index,
            'last_update': self.last_update.isoformat(),
            'total_observations': self.total_observations,
            'reality_splits': self.reality_splits
        }
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
    
    @classmethod
    def load(cls, filename: str = "quantum_garden_save.json") -> 'QuantumGarden':
        """Load garden state from a file."""
        if not os.path.exists(filename):
            return None
        
        with open(filename, 'r') as f:
            data = json.load(f)
        
        garden = cls()
        garden.states = [QuantumState.from_dict(s) for s in data['states']]
        garden.current_state_index = data['current_state_index']
        garden.last_update = datetime.fromisoformat(data['last_update'])
        garden.total_observations = data['total_observations']
        garden.reality_splits = data['reality_splits']
        
        return garden


class Game:
    """Main game controller."""
    
    def __init__(self):
        self.garden = None
        self.running = True
        
    def clear_screen(self):
        """Clear the terminal screen."""
        os.system('clear' if os.name != 'nt' else 'cls')
    
    def display_menu(self):
        """Display the main menu."""
        menu = """
╔═══════════════════════════════════════════╗
║            QUANTUM GARDEN                 ║
║     A Reality-Bending Experience          ║
╠═══════════════════════════════════════════╣
║  1. View Quantum States                   ║
║  2. Plant Seed                            ║
║  3. Collapse State (Observe)              ║
║  4. Create Superposition (Split Reality)  ║
║  5. View Statistics                       ║
║  6. Let Time Flow (Auto-evolve)           ║
║  7. Save Garden                           ║
║  8. Exit                                  ║
╚═══════════════════════════════════════════╝

Choice: """
        return input(menu)
    
    def view_states(self):
        """View all quantum states."""
        self.clear_screen()
        print("\n🌌 VIEWING ALL QUANTUM STATES 🌌\n")
        
        for i, state in enumerate(self.garden.states):
            print(self.garden.render_state(i))
            print()
        
        input("\nPress Enter to continue...")
    
    def plant_seed_interactive(self):
        """Interactive seed planting."""
        self.clear_screen()
        print("\n🌱 PLANTING SEED 🌱\n")
        print("Enter coordinates (0-19) for your seed:")
        
        try:
            x = int(input("X: "))
            y = int(input("Y: "))
            
            if 0 <= x < 20 and 0 <= y < 20:
                self.garden.plant_seed(x, y)
                print(f"\n✓ Seed planted at ({x}, {y}) across all quantum states!")
                print("The seed exists in superposition - it may be different in each reality...")
            else:
                print("\n✗ Invalid coordinates. Must be 0-19.")
        except ValueError:
            print("\n✗ Invalid input. Please enter numbers.")
        
        input("\nPress Enter to continue...")
    
    def collapse_state_interactive(self):
        """Interactive state collapse."""
        self.clear_screen()
        print("\n👁️  COLLAPSING QUANTUM STATE 👁️\n")
        print("By observing a state, you collapse the wavefunction.")
        print("All other realities will cease to exist.\n")
        
        for i, state in enumerate(self.garden.states):
            print(f"{i}. State {state.state_id} (Probability: {state.probability:.1%}, Age: {state.age:.1f}h)")
        
        try:
            choice = int(input("\nWhich state do you choose to observe? "))
            
            if self.garden.collapse_state(choice):
                print(f"\n✓ Reality collapsed to state {choice}!")
                print("All other quantum states have vanished from existence.")
                print("\n" + self.garden.render_state(0))
            else:
                print("\n✗ Invalid state.")
        except ValueError:
            print("\n✗ Invalid input.")
        
        input("\nPress Enter to continue...")
    
    def create_superposition_interactive(self):
        """Interactive superposition creation."""
        self.clear_screen()
        print("\n🌀 CREATING QUANTUM SUPERPOSITION 🌀\n")
        
        if len(self.garden.states) > 1:
            print("✗ Reality is already in superposition!")
            print("You must first collapse it to a single state.")
        else:
            self.garden.create_superposition()
            print("✓ Reality has been split into multiple quantum states!")
            print("Your garden now exists in parallel universes simultaneously.")
            print(f"\nNew states created: {len(self.garden.states)}")
        
        input("\nPress Enter to continue...")
    
    def view_statistics(self):
        """View garden statistics."""
        self.clear_screen()
        print(self.garden.get_stats())
        input("\nPress Enter to continue...")
    
    def auto_evolve(self):
        """Let time flow and auto-evolve the garden."""
        self.clear_screen()
        print("\n⏰ TIME FLOWS... ⏰\n")
        print("The garden evolves across quantum states...")
        
        hours = random.uniform(1, 5)
        self.garden.evolve_all_states(hours)
        
        print(f"\n✓ {hours:.1f} hours have passed.")
        print("The quantum garden has grown and changed.")
        
        input("\nPress Enter to continue...")
    
    def save_game(self):
        """Save the game."""
        self.clear_screen()
        self.garden.save()
        print("\n💾 GAME SAVED 💾\n")
        print("Your quantum garden has been preserved across spacetime.")
        input("\nPress Enter to continue...")
    
    def start(self):
        """Start the game."""
        self.clear_screen()
        
        print("""
╔═══════════════════════════════════════════╗
║            QUANTUM GARDEN                 ║
║     A Reality-Bending Experience          ║
╚═══════════════════════════════════════════╝

Welcome to Quantum Garden, where your garden exists
in multiple realities simultaneously.

Your actions cause quantum decoherence, collapsing
infinite possibilities into singular truths.

The garden evolves even when you're away, growing
through the streams of time...
        """)
        
        # Try to load saved game
        saved_garden = QuantumGarden.load()
        
        if saved_garden:
            choice = input("\nFound existing garden. Load it? (y/n): ")
            if choice.lower() == 'y':
                self.garden = saved_garden
                self.garden.update_time_evolution()
                print("\n✓ Garden loaded! Time has passed since your last visit...")
                time.sleep(2)
            else:
                self.garden = QuantumGarden()
                self.garden.initialize_garden()
        else:
            print("\nInitializing new quantum garden...")
            self.garden = QuantumGarden()
            self.garden.initialize_garden()
            time.sleep(1)
        
        self.game_loop()
    
    def game_loop(self):
        """Main game loop."""
        while self.running:
            # Update garden based on time
            self.garden.update_time_evolution()
            
            choice = self.display_menu()
            
            if choice == '1':
                self.view_states()
            elif choice == '2':
                self.plant_seed_interactive()
            elif choice == '3':
                self.collapse_state_interactive()
            elif choice == '4':
                self.create_superposition_interactive()
            elif choice == '5':
                self.view_statistics()
            elif choice == '6':
                self.auto_evolve()
            elif choice == '7':
                self.save_game()
            elif choice == '8':
                self.clear_screen()
                print("\n👋 Thank you for tending the Quantum Garden.\n")
                print("Remember: Every observation shapes reality.")
                print("Your garden continues to evolve in the quantum foam...\n")
                self.garden.save()
                self.running = False
            else:
                print("\nInvalid choice. Try again.")
                time.sleep(1)


def main():
    """Entry point."""
    game = Game()
    game.start()


if __name__ == "__main__":
    main()
