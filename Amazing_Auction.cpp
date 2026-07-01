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
    int n,k;
    cin >> n,k;
    vector<int> a(n);
    vector<int> c(n);
    for(int i = 0; i < n; ++i) cin >> a[i];
    for(int i = 0; i < n; ++i) cin >> c[i];

    sort(a.begin(), a.end(), greater<int>());

    int profit = INT_MIN;
    for(int i=k; i<n;i++){
        
    }
}
return 0;
}