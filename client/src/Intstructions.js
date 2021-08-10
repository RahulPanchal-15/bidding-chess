import React from "react";

import "./Instructions.css";

const Instructions = (props) => {
  return (
    <nav id="sidebar" className="navbar-light" style = {{ backgroundColor: "#e3f2fd"}} >
      <button className="closeButton" onClick={props.activateFn}>
              <img id="close-icon" src="./close.svg" alt="close"/>
        </button>
        <br/> 
          <h4><p align="center" style={{paddingLeft:"20px"}}>About</p></h4>
          <hr/>
        {/* <p align="left" style={{marginLeft: "8px"}}> */}
          <strong>BIDDING CHESS <span role="img" aria-label="emoji">♟</span></strong> is a crypto-based community chess game with a reward model.
          It's a team playing against team, but you don't know who your team mates are.
          You don't have to be a great chess player here, just be here at the right time and bid smart.
          <br/>
          <ul>  
            <li>Make a move <span role="img" aria-label="emoji">🚶🏼‍♂️</span></li>
            <li>Place your bid <span role="img" aria-label="emoji">💰</span></li>
            <li>Confirm the transaction <span role="img" aria-label="emoji">🤘🏼</span></li>
            <li>Wait for someone else to play (or just tell your friend to <span role="img" aria-label="emoji">🙋🏼‍♀️</span>)</li>
          </ul>
        {/* </p> */}

          Connect with us here on <a href="https://t.me/joinchat/8IcM5D1zIPQyNjE1" target="_blank" rel="noopener noreferrer">Telegram</a><span role="img" aria-label="emoji">🤝🏼</span>
          <hr/>
          <div className="accordion" id="accordionExample">
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingOne">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                  What is &nbsp; <strong>UBIQUITO</strong>
                </button>
              </h2>
              <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
                <div className="accordion-body">
                  <strong>UBIQUITO is a token you receive for playing the game.</strong> Obviously, the winners get higher rewards, but we surely won't leave you empty handed from here. Collect UBIQUITO and use them to place your bids.
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingTwo">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                  How much reward can I earn?
                </button>
              </h2>
              <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
                <div className="accordion-body">
                  You can earn upto 6%-20% returns on your bids! We take your percentage contribution in the side and reward you accordingly. If your side wins, you get your Ether back along with additional rewards. Rewards are composed of Ether from the loser pool and UBIQUITO! &nbsp;<span role="img" aria-label="emoji">🤑</span>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingFour">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                  Where can I get UBIQUITO?
                </button>
              </h2>
              <div id="collapseFour" className="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#accordionExample">
                <div className="accordion-body">
                  Join the telegram channel and send us your address, we can airdrop you some UBI. You can always bid and earn some yourself. <span role="img" aria-label="emoji">🤑</span>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingThree">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                  What if game ends in a Draw?
                </button>
              </h2>
              <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample">
                <div className="accordion-body">
                  We refund all your bids! &nbsp;<span role="img" aria-label="emoji">😉</span>
                </div>
              </div>
            </div>
          </div>
    </nav>
  )
}

export default Instructions;