import { TeamSelectionSimulationInfo } from "shared";
import parse from 'html-react-parser';

interface TableOddsViewProps {
    teams: TeamSelectionSimulationInfo[];
    numTournaments: number;
    showDialog: boolean;
    title: string;
    description: string;
    onSelectionChange: (teamIndex: number, oddsIndex: number, newOdds: number) => void;
    onRunSimulations: () => void;
    onResetToDefault: () => void;
    onDialogClose: () => void;
    onDialogOk: () => void;
    onNumTournamentsChange: (num: number) => void;
}

export const TableOddsView: React.FC<TableOddsViewProps> = ({
    teams,
    numTournaments,
    showDialog,
    title,
    description,
    onSelectionChange,
    onRunSimulations,
    onResetToDefault,
    onDialogClose,
    onDialogOk,
    onNumTournamentsChange,
}) => {
    return (
        <div className="march-madness-container">
            
            <h1>{title}</h1>
            <p>{parse(description)}</p>
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Conference</th>
                            <th>Team</th>
                            <th>Seed</th>
                            <th>Round 1 (%)</th>
                            <th>Round 2 (%)</th>
                            <th>Sweet 16 (%)</th>
                            <th>Elite 8 (%)</th>
                            <th>Final 4 (%)</th>
                            <th>Championship (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team, teamIndex) => (
                            <tr key={teamIndex}>
                                <td>{team.conference}</td>
                                <td>{team.team}</td>
                                <td>{team.seed}</td>
                                {team.selectionOdds.map((odds, oddsIndex) => (
                                    <td key={oddsIndex}>
                                        <input
                                            type="number"
                                            value={odds * 100} // Convert decimal to percentage
                                            onChange={(e) =>
                                                onSelectionChange(teamIndex, oddsIndex, Number(e.target.value))
                                            }
                                            style={{ width: '50px' }}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="controls">
                <button onClick={onRunSimulations}>Run Simulations</button>
                <button onClick={onResetToDefault}>Reset to Default</button>
            </div>
            {showDialog && (
                <div className="dialog">
                    <div className="dialog-content">
                        <label>
                            Number of tournaments to simulate:
                            <input
                                type="number"
                                value={numTournaments}
                                onChange={(e) => onNumTournamentsChange(Number(e.target.value))}
                            />
                        </label>
                        <div className="dialog-buttons">
                            <button onClick={onDialogClose}>Cancel</button>
                            <button onClick={onDialogOk}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};