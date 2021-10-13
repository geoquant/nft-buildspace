import './styles/App.css';

import twitterLogo from './assets/twitter-logo.svg';
import openSeaLogo from './assets/opensea-logo.svg';
import React from "react";
import { ethers } from "ethers";
import myEpicNft from './utils/MyEpicNFT.json';

const CONTRACT_ADDRESS = "0x93ad3eeB4ae2c2e47b5aE5E0cCC8C859212cc5D4";

// Constants
const TWITTER_HANDLE = 'JonnieLappen';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/jonnienft-v3';

const App = () => {
  const [currentAccount, setCurrentAccount] = React.useState("");
  const [mining, setMining] = React.useState(false);
  const [transactionUrl, setTransactionUrl] = React.useState("");
  const [totalMinted, setTotalMinted] = React.useState(0);
  const [totalSupply, setTotalSupply] = React.useState(0);
  const [correctNetwork, setCorrectNetwork] = React.useState(false);

  const checkIfWalletIsConnected = async () => {

    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account)

      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener()
    } else {
      console.log("No authorized account found")
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum && correctNetwork) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });

        connectedContract.totalMinted()
          .then((data) => {
            console.log('totalMinted');
            console.log(data);
            if (data)
              setTotalMinted(data.toNumber());
          })

        connectedContract.totalSupply()
          .then((data) => {
            console.log('totalSupply');
            console.log(data);
            if (data)
              setTotalSupply(data.toNumber());
          })

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      let chainId = await ethereum.request({ method: 'eth_chainId' });
      console.log("Connected to chain " + chainId);

      // String, hex code of the chainId of the Rinkebey test network
      const rinkebyChainId = "0x4";
      if (chainId !== rinkebyChainId) {
        alert("You are not connected to the Rinkeby Test Network!");
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener()
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        setMining(true);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait();

        setMining(false);

        setTransactionUrl(`https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }


  const checkCorrectNetwork = async () => {
    const { ethereum } = window;
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4";
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Rinkeby Test Network!");
      setCorrectNetwork(false);
    }
    else
      setCorrectNetwork(true);
  }

  React.useEffect(() => {
    checkIfWalletIsConnected();
    checkCorrectNetwork();
  }, [])


  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {correctNetwork && (
            <>
              {currentAccount === "" ? (
                <button onClick={connectWallet} className="cta-button connect-wallet-button">
                  Connect to Wallet
                </button>
              ) : (
                <button onClick={askContractToMintNft} className="cta-button connect-wallet-button"
                  disabled={mining}>
                  {mining ? 'Minting NFT...' : 'Mint NFT'}
                </button>
              )}

              {totalMinted && totalSupply && <p className="sub-text">
                {totalMinted}/{totalSupply} NFTs minted so far
              </p>}
            </>
          )}

          {!correctNetwork && <p className="sub-text">** You are in a wrong network. Please, switch to Rinkeby **</p>}
        </div>
        <div>
          {transactionUrl && <a
            className="footer-text"
            href={transactionUrl}
            target="_blank"
            rel="noopener noreferrer"
          >See transaction URL in rinkeby.etherscan.io</a>}
        </div>
        <div className="footer-container">
          <img alt="Opensea Logo" className="svg-logo" src={openSeaLogo} />
          <div>&nbsp;</div>
          <a className="footer-text" href={OPENSEA_LINK} target="_blank" rel="noopener noreferrer">View Collection on OpenSea</a>
          <img alt="Twitter Logo" className="svg-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
