import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import mongoose from 'mongoose';
import './App.css';
//import mongoose, { Collection, Schema } from 'mongoose';
import { connect } from 'mongoose';
import io from 'socket.io-client';
//import { redirect } from 'express/lib/response';
const socket = io('https://game-tictactoee.herokuapp.com/', {transports: ['websocket', 'polling', 'flashsocket'] });
//const { Schema } = mongoose;
const url=window.location.href;
let urlArr=url.split("/");
const hostAndPort=urlArr[0]+"//"+urlArr[2];


function App() {
  const [game, setGame] = useState(Array(9).fill(''));
  const [turnNumber, setTurnNumber] = useState(0);
  const [myTurn, setMyTurn] = useState(true);
  const [winner, setWinner] = useState(false);
  const [xo, setXO] = useState('X');
  const [player, setPlayer] = useState('');
  const [hasOpponent, setHasOpponent] = useState(false);
  const [share, setShare] = useState(false);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const paramsRoom = params.get('room');
  const [room, setRoom] = useState(paramsRoom);

  const [turnData, setTurnData] = useState(false);

  const sendTurn = (index) => {
    if (!game[index] && !winner && myTurn && hasOpponent) {
      socket.emit('reqTurn', JSON.stringify({ index, value: xo, room }));
    }
  };

  const sendRestart = () => {
    socket.emit('reqRestart', JSON.stringify({ room }));
  };

  const restart = () => {
    setGame(Array(9).fill(''));
    setWinner(false);
    setTurnNumber(0);
    setMyTurn(false);
  };

  useEffect(() => {
    combinations.forEach((c) => {
      if (game[c[0]] === game[c[1]] && game[c[0]] === game[c[2]] && game[c[0]] !== '') {
        setWinner(true);
      }
    });

    if (turnNumber === 0) {
      setMyTurn(xo === 'X' ? true : false);
    }
  }, [game, turnNumber, xo]);

  useEffect(() => {
    socket.on('playerTurn', (json) => {
      setTurnData(json);
    });

    socket.on('restart', () => {
      restart();
    });

    socket.on('opponent_joined', () => {
      setHasOpponent(true);
      setShare(false);
    });

    
  }, []);
  useEffect(() => {
    socket.on("create_new_room", () => {
      const newRoomName = random();
      socket.emit('create', newRoomName);
      setRoom(newRoomName);
      setMyTurn(true);
      setXO('X');
    }
    );
  })

  useEffect(() => {
    if (turnData) {
      const data = JSON.parse(turnData);
      let g = [...game];
      if (!g[data.index] && !winner) {
        g[data.index] = data.value;
        setGame(g);
        setTurnNumber(turnNumber + 1);
        setTurnData(false);
        setMyTurn(!myTurn);
        setPlayer(data.value==='X'? '1': '2');
      }
    }
  }, [turnData, game, turnNumber, winner, myTurn]);

  useEffect(() => {
    //const roomnow = Rooms.roomnames;
    if (paramsRoom) {
      // means you are player 2
      setXO('O');
      socket.emit('join', paramsRoom);
      setRoom(paramsRoom);
      setMyTurn(false);
    } else {
      // means you are player 1
      const newRoomName = random();
      socket.emit('create', newRoomName);
      setRoom(newRoomName);
      setMyTurn(true);
    }
  }, [paramsRoom]);

  return (
    <div className="container">
      Room: {room}
      <button className="btn" onClick={() => setShare(!share)}>
        Share
      </button>
      {share ? (
        <>
          <br />
          <br />
          Share link: <input type="text" value={`${hostAndPort}?room=${room}`} readOnly />
        </>
      ) : null}
      <br />
      <br />
      {myTurn ? 'Your Turn' : 'Opponent Turn'}
      <br />
      {hasOpponent ? '' : 'Waiting for opponent to join the Room'}
      <p>
        {winner || turnNumber === 9 ? (
          <button className="btn" onClick={sendRestart}>
            Restart
          </button>
        ) : null}
        {winner ? <span>{!myTurn? "You have won": "You lost, try again?"}</span> : turnNumber === 9 ? <span>It's a tie!</span> : <br />}
      </p>
      <div className="row">
        <Box index={0} turn={sendTurn} value={game[0]} />
        <Box index={1} turn={sendTurn} value={game[1]} />
        <Box index={2} turn={sendTurn} value={game[2]} />
      </div>
      <div className="row">
        <Box index={3} turn={sendTurn} value={game[3]} />
        <Box index={4} turn={sendTurn} value={game[4]} />
        <Box index={5} turn={sendTurn} value={game[5]} />
      </div>
      <div className="row">
        <Box index={6} turn={sendTurn} value={game[6]} />
        <Box index={7} turn={sendTurn} value={game[7]} />
        <Box index={8} turn={sendTurn} value={game[8]} />
      </div>
    </div>
  );
}

const Box = ({ index, turn, value }) => {
  return (
    <div className="box" onClick={() => turn(index)}>
      {value}
    </div>
  );
};

const combinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const random = () => {
  return Array.from(Array(8), () => Math.floor(Math.random() * 36).toString(36)).join('');
};

export default App;
