#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>
#include <stack>
#include <set>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <cmath>
#include <cstring>
#include <string>
#include <climits>
#include <iomanip>
#include <numeric>
#include <functional>
#include <deque>
#include <list>
#include <sstream>
#include <bitset>
#include <chrono>
using namespace std;
int  main(){
int t;
cin >> t;
while(t--){
    int x,y;
    cin>>x>>y;
    int total = 0;

    while(x!=y){
        total+= ceil(x/10.0);
        x-=1;
    }

    cout<<total<<endl;
}
return 0;
}